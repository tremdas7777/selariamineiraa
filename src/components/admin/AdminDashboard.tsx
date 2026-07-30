import { Activity, DollarSign, ShoppingBag, TrendingUp } from "lucide-react";
import type { Order, TrackedEvent } from "@/lib/admin.types";
import {
  STEP_LABELS, STEP_ORDER, brl, hourlySeries, revenueCents, uniqueVisitorsByStep,
} from "./admin-utils";

type Props = { events: TrackedEvent[]; orders: Order[]; now: number };

function Kpi({ icon: Icon, label, value, hint }: {
  icon: typeof Activity; label: string; value: string; hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className="size-4 text-primary" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function AdminDashboard({ events, orders, now }: Props) {
  const steps = uniqueVisitorsByStep(events);
  const approved = orders.filter((o) => o.status === "APPROVED");
  const revenue = revenueCents(orders);
  const conv = steps.visit ? (steps.paid / steps.visit) * 100 : 0;
  const series = hourlySeries(events, now);
  const maxEvents = Math.max(1, ...series.map((s) => s.eventos));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={DollarSign} label="Receita aprovada" value={brl(revenue)} hint={`${approved.length} pedidos pagos`} />
        <Kpi icon={ShoppingBag} label="Pedidos" value={String(orders.length)} hint={`${orders.filter((o) => o.status === "PENDING").length} pendentes`} />
        <Kpi icon={Activity} label="Visitantes únicos" value={String(steps.visit)} hint="janela em memória" />
        <Kpi icon={TrendingUp} label="Conversão" value={`${conv.toFixed(1)}%`} hint="visita → pago" />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">Funil de conversão</h3>
        <div className="mt-4 space-y-3">
          {STEP_ORDER.map((step) => {
            const value = steps[step];
            const pct = steps.visit ? (value / steps.visit) * 100 : 0;
            return (
              <div key={step}>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{STEP_LABELS[step]}</span>
                  <span>{value} · {pct.toFixed(0)}%</span>
                </div>
                <div className="mt-1 h-3 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(pct, value ? 3 : 0)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">Atividade nas últimas 12h</h3>
        <div className="mt-4 flex h-32 items-end gap-2">
          {series.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-primary/70"
                style={{ height: `${(s.eventos / maxEvents) * 100}%`, minHeight: s.eventos ? 4 : 1 }}
                title={`${s.eventos} eventos`}
              />
              <span className="text-[10px] text-muted-foreground">{s.hour}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
