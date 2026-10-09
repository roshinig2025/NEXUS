var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var SHELL_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Self-Optimizing Web Application</title>
    <script type="module" crossorigin src="/assets/index-BZipBuZD.js"><\/script>
    <link rel="stylesheet" crossorigin href="/assets/index-DssnFqtN.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;
var API_PATHS = /* @__PURE__ */ new Set(["health", "metrics", "predict", "feedback", "optimize"]);
var worker_default = {
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
  }
};
async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/";
  const name = path.split("/").pop() || "/";
  const backendUrl = typeof env.BACKEND_URL === "string" && env.BACKEND_URL ? env.BACKEND_URL : "http://127.0.0.1:8000";
  const allowProxy = env.ALLOW_PROXY === "1" || env.ALLOW_PROXY === true;
  if (API_PATHS.has(name) || name === "predict" || name === "feedback" || name === "optimize") {
    if (allowProxy) {
      try {
        const res = await fetch(new Request(new URL(path + url.search, backendUrl), request));
        let body;
        try {
          body = await res.text();
        } catch {
          body = JSON.stringify({ error: "backend response unreadable" });
        }
        return new Response(body, { status: res.status, statusText: res.statusText, headers: { "Content-Type": "application/json" } });
      } catch (err) {
        return json502("backend unavailable", err);
      }
    }
    if (name === "health") return syntheticHealth();
    if (name === "metrics") return syntheticMetrics();
    if (name === "predict") return await syntheticPredict(request);
    if (name === "feedback") return await syntheticFeedback(request);
    if (name === "optimize") return syntheticOptimize();
    return json502("unknown api route");
  }
  if (name.startsWith("assets/") || name === "favicon.ico" || name.endsWith(".js") || name.endsWith(".css") || name.endsWith(".png") || name.endsWith(".svg")) {
    if (env.ASSETS) {
      try {
        const r = await env.ASSETS.fetch(request);
        if (r.ok) return r;
      } catch {
      }
    }
    return new Response("not found", { status: 404 });
  }
  if (name === "__env") {
    return new Response(JSON.stringify({ ALLOW_PROXY: env.ALLOW_PROXY, BACKEND_URL: env.BACKEND_URL }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  return new Response(SHELL_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
__name(handle, "handle");
function json502(detail, err) {
  return new Response(
    JSON.stringify({ error: "backend unavailable", detail: detail || (err instanceof Error ? err.message : String(err || "")) }),
    { status: 502, headers: { "Content-Type": "application/json" } }
  );
}
__name(json502, "json502");
function syntheticHealth() {
  return new Response(
    JSON.stringify({ status: "ok", model_loaded: true, model_type: "RandomForestClassifier", n_features: 10, n_classes: 2, n_samples: 2e3, test_accuracy: 0.915 }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
__name(syntheticHealth, "syntheticHealth");
function syntheticMetrics() {
  return new Response(
    JSON.stringify({ metrics: [], latest: { total_predictions: 0, total_feedback: 0, running_accuracy: 0, avg_confidence: 0 } }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
__name(syntheticMetrics, "syntheticMetrics");
async function syntheticPredict(request) {
  let features = null;
  try {
    const body = await request.text();
    if (body) {
      const parsed = JSON.parse(body);
      if (Array.isArray(parsed.features)) features = parsed.features;
    }
  } catch {
  }
  const pred = features && features.length === 10 ? 1 : 0;
  return new Response(
    JSON.stringify({ prediction: pred, confidence: 0.92, probabilities: [0.08, 0.92], prediction_id: crypto.randomUUID() }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
__name(syntheticPredict, "syntheticPredict");
async function syntheticFeedback(request) {
  let pid = "demo-prediction-id";
  try {
    const body = await request.text();
    if (body) {
      const parsed = JSON.parse(body);
      if (parsed.prediction_id) pid = parsed.prediction_id;
    }
  } catch {
  }
  return new Response(
    JSON.stringify({ received: true, prediction_id: pid }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
__name(syntheticFeedback, "syntheticFeedback");
function syntheticOptimize() {
  return new Response(
    JSON.stringify({
      analyzed_at: (/* @__PURE__ */ new Date()).toISOString(),
      predictions: 0,
      feedbacks: 0,
      running_accuracy: 0,
      avg_confidence: 0,
      recommendations: [{ action: "send_predictions", rationale: "No predictions recorded yet; collect traffic before optimizing.", priority: "high" }]
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
__name(syntheticOptimize, "syntheticOptimize");

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-vgUZ8J/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-vgUZ8J/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
