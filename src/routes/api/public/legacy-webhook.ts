import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/legacy-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          console.log("[legacy-webhook]", JSON.stringify(body));
          const payload = body as { referenceId?: string; id?: string; status?: string };
          const key = payload.referenceId ?? payload.id;
          const status = String(payload.status ?? "").toUpperCase();
          if (key && ["PENDING", "APPROVED", "FAILED", "REFUNDED"].includes(status)) {
            const { updateOrderStatus } = await import("@/lib/admin.server");
            updateOrderStatus(key, status as "PENDING" | "APPROVED" | "FAILED" | "REFUNDED");
          }
        } catch (err) {
          console.error("[legacy-webhook] parse error", err);
        }
        return new Response("ok", { status: 200 });
      },
    },
  },
});
