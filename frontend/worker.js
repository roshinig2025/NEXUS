import model from "./src/model.json";

const MODEL = model; // { n_features, classes, trees: [{feature, threshold, left, right, value}] }

const N_FEATURES = MODEL.n_features;
const TEST_ACCURACY = 0.915;
const N_SAMPLES = 2000;

const API_RE = /^\/(health|metrics|predict|feedback|optimize)\/?$/;

export default {
  async fetch(request, env, ctx) {
    try {
      return await handle(request, env);
    } catch (err) {
      console.error("unhandled worker error:", err instanceof Error ? err.message : String(err));
      return new Response(
        JSON.stringify({ error: "internal error", detail: err instanceof Error ? err.message : String(err) }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};

async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const apiMatch = API_RE.exec(path);

  if (apiMatch) {
    const route = apiMatch[1];
    try {
      if (route === "health") return ok(healthPayload());
      if (route === "metrics") return ok(metricsPayload());
      if (route === "predict") return await handlePredict(request);
      if (route === "feedback") return await handleFeedback(request);
      if (route === "optimize") return ok(optimizePayload());
    } catch (err) {
      return ok({ error: err instanceof Error ? err.message : String(err) }, 500);
    }
  }

  if (env.ASSETS && request.method === "GET") {
    try {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status !== 404) return asset;
    } catch {}
  }

  // SPA fallback
  return env.ASSETS
    ? env.ASSETS.fetch(new Request(new URL("/index.html", url)))
    : new Response("not found", { status: 404 });
}

function ok(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function healthPayload() {
  return {
    status: "ok",
    model_loaded: true,
    model_type: "RandomForestClassifier",
    n_features: N_FEATURES,
    n_classes: MODEL.classes.length,
    n_samples: N_SAMPLES,
    test_accuracy: TEST_ACCURACY,
  };
}

// ---- inference ----

function treePredict(tree, x) {
  let node = 0;
  while (tree.left[node] !== -1) {
    const f = tree.feature[node];
    const t = tree.threshold[node];
    node = x[f] <= t ? tree.left[node] : tree.right[node];
  }
  // sklearn >=1.9 tree.value shape is (n_nodes, 1, n_classes): value[node] = [[p0, p1]] per-tree class proportions
  const v = tree.value[node];
  return [v[0][0], v[0][1]];
}

function forestPredictProba(x) {
  let c0 = 0;
  let c1 = 0;
  for (const tree of MODEL.trees) {
    const [a, b] = treePredict(tree, x);
    c0 += a;
    c1 += b;
  }
  const total = c0 + c1 || 1;
  const p0 = c0 / total;
  const p1 = c1 / total;
  return [p0, p1];
}

// ---- request handlers ----

async function readJson(request) {
  try {
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

async function handlePredict(request) {
  if (request.method !== "POST") return ok({ error: "method not allowed" }, 405);
  const body = await readJson(request);
  const features = Array.isArray(body.features) ? body.features : null;
  if (!features || features.length !== N_FEATURES) {
    return ok({ error: "features must contain exactly 10 numeric values" }, 422);
  }
  const x = features.map(Number);
  if (x.some((v) => !Number.isFinite(v))) {
    return ok({ error: "features must be numeric" }, 422);
  }

  const [p0, p1] = forestPredictProba(x);
  const prediction = p1 >= p0 ? 1 : 0;
  const confidence = Math.max(p0, p1);

  const state = stateRef();
  state.total_predictions += 1;
  state.confidence_sum += confidence;
  state.recent_prediction_id = crypto.randomUUID();
  state.last_prediction = prediction;
  pushMetricPoint(state);

  return ok({
    prediction,
    confidence: round(confidence),
    probabilities: [round(p0), round(p1)],
    prediction_id: state.recent_prediction_id,
  });
}

async function handleFeedback(request) {
  if (request.method !== "POST") return ok({ error: "method not allowed" }, 405);
  const body = await readJson(request);
  const pid = typeof body.prediction_id === "string" ? body.prediction_id : null;
  const actual = body.actual === 0 || body.actual === 1 ? body.actual : null;
  if (!pid || actual === null) {
    return ok({ error: "prediction_id and actual (0 or 1) are required" }, 422);
  }
  const state = stateRef();
  state.feedback_store.set(pid, actual);
  state.total_feedback += 1;
  if (state.recent_prediction_id === pid) {
    state.correct_predictions += actual === state.last_prediction ? 1 : 0;
  }
  pushMetricPoint(state);
  return ok({ received: true, prediction_id: pid });
}

function optimizePayload() {
  const state = stateRef();
  const acc = state.total_feedback ? state.correct_predictions / state.total_feedback : 0.0;
  const conf = state.total_predictions ? state.confidence_sum / state.total_predictions : 0.0;
  const preds = state.total_predictions;
  const feeds = state.total_feedback;

  const recs = [];
  if (preds === 0) {
    recs.push({
      action: "send_predictions",
      rationale: "No predictions recorded yet; collect traffic before optimizing.",
      priority: "high",
    });
  } else {
    if (acc < 0.8) {
      recs.push({
        action: "review_model_thresholds",
        rationale: `Running accuracy is ${(acc * 100).toFixed(1)}%, below 80% target. Consider threshold tuning or retraining.`,
        priority: "high",
      });
    } else {
      recs.push({
        action: "maintain_model",
        rationale: `Running accuracy is ${(acc * 100).toFixed(1)}%, above target. Continue monitoring.`,
        priority: "low",
      });
    }
    if (conf < 0.6) {
      recs.push({
        action: "increase_evidence",
        rationale: `Average confidence is ${conf.toFixed(2)}, low. Prefer higher-confidence decisions or gather more features.`,
        priority: "medium",
      });
    } else if (conf > 0.9) {
      recs.push({
        action: "scale_confident_paths",
        rationale: `High average confidence (${conf.toFixed(2)}). Consider automating high-confidence decision paths.`,
        priority: "medium",
      });
    }
    if (feeds < Math.max(10, Math.floor(preds / 5))) {
      recs.push({
        action: "collect_more_feedback",
        rationale: `Feedback coverage is low (${feeds} feedbacks for ${preds} predictions). More ground truth improves optimization.`,
        priority: "high",
      });
    }
  }

  return {
    analyzed_at: new Date().toISOString(),
    predictions: preds,
    feedbacks: feeds,
    running_accuracy: round(acc),
    avg_confidence: round(conf),
    recommendations: recs,
  };
}

function metricsPayload() {
  const state = stateRef();
  const acc = state.total_feedback ? state.correct_predictions / state.total_feedback : 0.0;
  const conf = state.total_predictions ? state.confidence_sum / state.total_predictions : 0.0;
  const latest = {
    timestamp: new Date().toISOString(),
    total_predictions: state.total_predictions,
    total_feedback: state.total_feedback,
    running_accuracy: round(acc),
    avg_confidence: round(conf),
    correct_predictions: state.correct_predictions,
  };
  return { metrics: state.metric_points, latest };
}

// ---- in-isolate state ----

let _state = null;
function stateRef() {
  if (!_state) {
    _state = {
      feedback_store: new Map(),
      total_predictions: 0,
      total_feedback: 0,
      correct_predictions: 0,
      confidence_sum: 0.0,
      recent_prediction_id: null,
      last_prediction: null,
      metric_points: [],
    };
  }
  return _state;
}

function pushMetricPoint(state) {
  const acc = state.total_feedback ? state.correct_predictions / state.total_feedback : 0.0;
  const conf = state.total_predictions ? state.confidence_sum / state.total_predictions : 0.0;
  state.metric_points.push({
    timestamp: new Date().toISOString(),
    total_predictions: state.total_predictions,
    total_feedback: state.total_feedback,
    running_accuracy: round(acc),
    avg_confidence: round(conf),
    correct_predictions: state.correct_predictions,
  });
  if (state.metric_points.length > 120) state.metric_points.shift();
}

function round(v) {
  return Math.round(v * 10000) / 10000;
}
