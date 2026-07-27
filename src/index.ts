import type { Env } from "./env";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return new Response(
        JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
        {
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
          },
        }
      );
    }

    // For SPA routes like /blog or /projects, fetch root "/" asset so index.html layout is served without redirecting
    const hasExtension = /\.[a-z0-9]+$/i.test(url.pathname);
    if (!hasExtension && url.pathname !== "/") {
      const rootReq = new Request(new URL("/", request.url), request);
      return env.ASSETS.fetch(rootReq);
    }

    return env.ASSETS.fetch(request);
  },
};
