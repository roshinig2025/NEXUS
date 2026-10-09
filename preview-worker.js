export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // API proxy to the locally running backend during preview
    if (path.startsWith("/health") || path.startsWith("/metrics") ||
        path.startsWith("/predict") || path.startsWith("/feedback") ||
        path.startsWith("/optimize")) {
      const backend = "http://127.0.0.1:8000";
      const backendUrl = backend + path + (url.search || "");
      const backendReq = new Request(backendUrl, request);
      const backendRes = await fetch(backendReq);
      return new Response(backendRes.body, backendRes);
    }

    // Static assets + SPA fallback
    const assetRoot = "./frontend/dist";
    if (path.startsWith("/assets/")) {
      const file = assetRoot + path;
      try {
        const body = await Deno.readFile(file);
        const ct = path.endsWith(".js") ? "application/javascript" :
                   path.endsWith(".css") ? "text/css" :
                   path.endsWith(".html") ? "text/html" : "application/octet-stream";
        return new Response(body, { headers: { "Content-Type": ct } });
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
