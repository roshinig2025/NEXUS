export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // API proxy to the locally running backend during preview
    const apiPaths = ["/health", "/metrics", "/predict", "/feedback", "/optimize"];
    if (apiPaths.some((p) => path.startsWith(p))) {
      const backend = "http://127.0.0.1:8000";
      const backendUrl = backend + path + (url.search || "");
      try {
        const backendReq = new Request(backendUrl, request);
        const backendRes = await fetch(backendReq);
        return new Response(backendRes.body, {
          status: backendRes.status,
          headers: backendRes.headers,
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "backend unavailable" }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Static assets + SPA fallback
    const assetRoot = "./frontend/dist";
    if (path.startsWith("/assets/")) {
      try {
        const body = await Deno.readFile(assetRoot + path);
        const ext = path.split(".").pop();
        const contentType = {
          js: "application/javascript",
          css: "text/css",
          html: "text/html",
        }[ext] || "application/octet-stream";
        return new Response(body, { headers: { "Content-Type": contentType } });
      } catch {
        return new Response("not found", { status: 404 });
      }
    }

    if (path === "/" || path.endsWith(".html")) {
      const body = await Deno.readFile(assetRoot + "/index.html");
      return new Response(body, { headers: { "Content-Type": "text/html" } });
    }

    return new Response("not found", { status: 404 });
  },
};
