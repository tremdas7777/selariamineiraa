import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/legacy-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          // TODO: persistir status em um banco quando a Cloud estiver ligada.
          console.log("[legacy-webhook]", JSON.stringify(body));
        } catch (err) {
          console.error("[legacy-webhook] parse error", err);
        }
        return new Response("ok", { status: 200 });
      },
    },
  },
});
