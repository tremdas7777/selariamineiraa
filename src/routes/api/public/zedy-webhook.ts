import { createFileRoute } from "@tanstack/react-router";
import type { OrderStatus } from "@/lib/admin.types";

type ZedyWebhook = {
  eventType?: string;
  orderId?: string;
  status?: string;
  paymentMethod?: string;
  customer?: { name?: string; email?: string; phone?: string };
  address?: { city?: string; state?: string };
  products?: { name?: string; quantity?: number; priceInCents?: number }[];
  commission?: { totalPriceInCents?: number };
};

const STATUS_MAP: Record<string, OrderStatus> = {
  waiting_payment: "PENDING",
  paid: "APPROVED",
  refused: "FAILED",
  refunded: "REFUNDED",
};

export const Route = createFileRoute("/api/public/zedy-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Autenticação opcional: se ZEDY_WEBHOOK_TOKEN estiver definido, exige o Bearer.
        const expected = process.env.ZEDY_WEBHOOK_TOKEN;
        if (expected && request.headers.get("authorization") !== `Bearer ${expected}`) {
          return new Response("unauthorized", { status: 401 });
        }

        try {
          const body = (await request.json().catch(() => ({}))) as ZedyWebhook;
          const orderId = String(body.orderId ?? "");
          if (!orderId) return new Response("ok", { status: 200 });

          const items = (body.products ?? []).slice(0, 50).map((p) => ({
            title: String(p.name ?? "Produto"),
            quantity: Number(p.quantity ?? 1),
            unitPrice: Number(p.priceInCents ?? 0),
          }));
          const amount =
            Number(body.commission?.totalPriceInCents ?? 0) ||
            items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

          const { upsertOrder, upsertLead, markLeadConverted, notifyIntegrations } = await import(
            "@/lib/admin.server"
          );

          if (body.eventType === "CART_ABANDONED" || body.eventType === "BILLET_CREATED") {
            await upsertLead({
              visitorId: `zedy-${orderId}`,
              name: String(body.customer?.name ?? ""),
              email: String(body.customer?.email ?? ""),
              phone: String(body.customer?.phone ?? ""),
              city: String(body.address?.city ?? ""),
              uf: String(body.address?.state ?? ""),
              amount,
              items,
            });
            return new Response("ok", { status: 200 });
          }

          const order = {
            id: orderId,
            referenceId: orderId,
            status: STATUS_MAP[String(body.status ?? "")] ?? ("PENDING" as OrderStatus),
            method: (body.paymentMethod === "credit_card" ? "CREDIT_CARD" : "PIX") as
              | "PIX"
              | "CREDIT_CARD",
            amount,
            customerName: String(body.customer?.name ?? ""),
            customerEmail: String(body.customer?.email ?? ""),
            customerPhone: String(body.customer?.phone ?? ""),
            city: String(body.address?.city ?? ""),
            uf: String(body.address?.state ?? ""),
            items,
          };
          await upsertOrder(order);
          if (order.status === "APPROVED") {
            await markLeadConverted(order.customerEmail, order.customerPhone);
          }
          await notifyIntegrations(order);
        } catch (err) {
          console.error("[zedy-webhook]", err);
        }
        return new Response("ok", { status: 200 });
      },
    },
  },
});
