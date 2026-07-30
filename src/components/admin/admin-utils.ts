import type { Order, TrackedEvent, FunnelStep } from "@/lib/admin.types";

export const STEP_LABELS: Record<FunnelStep, string> = {
  visit: "Visita",
  product: "Produto",
  cart: "Carrinho",
  checkout: "Checkout",
  paid: "Pago",
};

export const STEP_ORDER: FunnelStep[] = ["visit", "product", "cart", "checkout", "paid"];

export function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function uniqueVisitorsByStep(events: TrackedEvent[]): Record<FunnelStep, number> {
  const map: Record<FunnelStep, Set<string>> = {
    visit: new Set(), product: new Set(), cart: new Set(), checkout: new Set(), paid: new Set(),
  };
  for (const e of events) map[e.step]?.add(e.visitorId);
  return {
    visit: map.visit.size,
    product: map.product.size,
    cart: map.cart.size,
    checkout: map.checkout.size,
    paid: map.paid.size,
  };
}

export function revenueCents(orders: Order[]): number {
  return orders.filter((o) => o.status === "APPROVED").reduce((s, o) => s + o.amount, 0);
}

export function hourlySeries(events: TrackedEvent[], now: number, hours = 12) {
  const buckets: { hour: string; eventos: number; pedidos: number }[] = [];
  for (let i = hours - 1; i >= 0; i--) {
    const start = now - i * 3600_000;
    const d = new Date(start);
    buckets.push({ hour: `${String(d.getHours()).padStart(2, "0")}h`, eventos: 0, pedidos: 0 });
  }
  for (const e of events) {
    const diff = Math.floor((now - e.at) / 3600_000);
    if (diff < 0 || diff >= hours) continue;
    const b = buckets[hours - 1 - diff];
    if (!b) continue;
    b.eventos += 1;
    if (e.step === "paid") b.pedidos += 1;
  }
  return buckets;
}

export function topProducts(events: TrackedEvent[], limit = 6) {
  const counts = new Map<string, number>();
  for (const e of events) {
    if (e.step !== "product" || !e.label) continue;
    counts.set(e.label, (counts.get(e.label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, views]) => ({ name, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

export function activeVisitors(events: TrackedEvent[], now: number, windowMs = 5 * 60_000) {
  const map = new Map<string, TrackedEvent>();
  for (const e of events) {
    if (now - e.at > windowMs) continue;
    const prev = map.get(e.visitorId);
    if (!prev || prev.at < e.at) map.set(e.visitorId, e);
  }
  return [...map.values()].sort((a, b) => b.at - a.at);
}

export function timeAgo(at: number, now: number): string {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 60) return `${s}s atrás`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}min atrás`;
  return `${Math.round(m / 60)}h atrás`;
}
