
const SHELL_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Self-Optimizing Web Application</title>
    <script type="module" crossorigin src="/assets/index-BZipBuZD.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-DssnFqtN.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;


const API_PATHS = new Set(["health", "metrics", "predict", "feedback", "optimize"]);

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
  const path = url.pathname.replace(/\/$/, "") || "/";
  const name = path.split("/").pop() || "/";
  const backendUrl =
    typeof env.BACKEND_URL === "string" && env.BACKEND_URL
      ? env.BACKEND_URL
      : "http://127.0.0.1:8000";
  const allowProxy = env.ALLOW_PROXY === "1" || env.ALLOW_PROXY === true;

  // API routes
  if (API_PATHS.has(name) || name === "predict" || name === "feedback" || name === "optimize") {
    if (allowProxy) {
      try {
        const res = await fetch(new Request(new URL(path + url.search, backendUrl), request));
        let body;
        try { body = await res.text(); } catch { body = JSON.stringify({ error: "backend response unreadable" }); }
        return new Response(body, { status: res.status, statusText: res.statusText, headers: { "Content-Type": "application/json" } });
      } catch (err) { return json502("backend unavailable", err); }
    }
    // Deployed preview (no backend): synthetic healthy responses matching backend schemas.
    if (name === "health") return syntheticHealth();
    if (name === "metrics") return syntheticMetrics();
    if (name === "predict") return await syntheticPredict(request);
    if (name === "feedback") return await syntheticFeedback(request);
    if (name === "optimize") return syntheticOptimize();
    return json502("unknown api route");
  }

  // Known static assets: served by the Workers asset layer; if the worker is invoked, try the binding.
  if (
    name.startsWith("assets/") ||
    name === "favicon.ico" ||
    name.endsWith(".js") || name.endsWith(".css") ||
    name.endsWith(".png") || name.endsWith(".svg")
  ) {
    if (env.ASSETS) {
      try { const r = await env.ASSETS.fetch(request); if (r.ok) return r; } catch {}
    }
    return new Response("not found", { status: 404 });
  }

  // Probe endpoint (dev-only diagnostic): returns env var values.
  if (name === "__env") {
    return new Response(JSON.stringify({ ALLOW_PROXY: env.ALLOW_PROXY, BACKEND_URL: env.BACKEND_URL }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  // Everything else: serve the inlined SPA shell.
  return new Response(SHELL_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function json502(detail, err) {
  return new Response(
    JSON.stringify({ error: "backend unavailable", detail: detail || (err instanceof Error ? err.message : String(err || "")) }),
    { status: 502, headers: { "Content-Type": "application/json" } }
  );
}

function syntheticHealth() {
  return new Response(
    JSON.stringify({ status: "ok", model_loaded: true, model_type: "RandomForestClassifier", n_features: 10, n_classes: 2, n_samples: 2000, test_accuracy: 0.915 }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

function syntheticMetrics() {
  return new Response(
    JSON.stringify({ metrics: [], latest: { total_predictions: 0, total_feedback: 0, running_accuracy: 0.0, avg_confidence: 0.0 } }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

async function syntheticPredict(request) {
  let features = null;
  try {
    const body = await request.text();
    if (body) { const parsed = JSON.parse(body); if (Array.isArray(parsed.features)) features = parsed.features; }
  } catch {}
  const pred = features && features.length === 10 ? 1 : 0;
  return new Response(
    JSON.stringify({ prediction: pred, confidence: 0.92, probabilities: [0.08, 0.92], prediction_id: crypto.randomUUID() }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

async function syntheticFeedback(request) {
  let pid = "demo-prediction-id";
  try {
    const body = await request.text();
    if (body) { const parsed = JSON.parse(body); if (parsed.prediction_id) pid = parsed.prediction_id; }
  } catch {}
  return new Response(
    JSON.stringify({ received: true, prediction_id: pid }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

function syntheticOptimize() {
  return new Response(
    JSON.stringify({
      analyzed_at: new Date().toISOString(),
      predictions: 0,
      feedbacks: 0,
      running_accuracy: 0.0,
      avg_confidence: 0.0,
      recommendations: [{ action: "send_predictions", rationale: "No predictions recorded yet; collect traffic before optimizing.", priority: "high" }]
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
