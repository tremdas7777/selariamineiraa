import type { Order, TrackedEvent } from "@/lib/admin.types";
import { brl, revenueCents, topProducts, uniqueVisitorsByStep } from "./admin-utils";

export function AdminAnalytics({ events, orders }: { events: TrackedEvent[]; orders: Order[] }) {
  const steps = uniqueVisitorsByStep(events);
  const products = topProducts(events, 8);
  const maxViews = Math.max(1, ...products.map((p) => p.views));
  const approved = orders.filter((o) => o.status === "APPROVED");
  const ticket = approved.length ? revenueCents(orders) / approved.length : 0;
  const pix = orders.filter((o) => o.method === "PIX").length;
  const card = orders.length - pix;
  const abandonment = steps.checkout ? 100 - (steps.paid / steps.checkout) * 100 : 0;

  const cities = new Map<string, number>();
  for (const o of orders) {
    const key = `${o.city}/${o.uf}`;
    cities.set(key, (cities.get(key) ?? 0) + 1);
  }
  const topCities = [...cities.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">Produtos mais vistos</h3>
        <div className="mt-4 space-y-2">
          {products.length === 0 && <p className="text-sm text-muted-foreground">Sem visualizações ainda.</p>}
          {products.map((p) => (
            <div key={p.name}>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="truncate pr-2 text-foreground">{p.name}</span>
                <span>{p.views}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-secondary">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(p.views / maxViews) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs uppercase text-muted-foreground">Ticket médio</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{brl(ticket)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs uppercase text-muted-foreground">Abandono no checkout</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{abandonment.toFixed(0)}%</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Métodos de pagamento</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">PIX</span><span className="text-foreground">{pix}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cartão</span><span className="text-foreground">{card}</span></div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Principais cidades</h3>
          <div className="mt-3 space-y-2 text-sm">
            {topCities.length === 0 && <p className="text-muted-foreground">Sem dados.</p>}
            {topCities.map(([city, n]) => (
              <div key={city} className="flex justify-between">
                <span className="text-muted-foreground">{city}</span>
                <span className="text-foreground">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
