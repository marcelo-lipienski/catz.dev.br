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

    return env.ASSETS.fetch(request);
  },
};
