import type { TrackedEvent } from "@/lib/admin.types";
import { STEP_LABELS, STEP_ORDER, activeVisitors, timeAgo, uniqueVisitorsByStep } from "./admin-utils";

const DOT: Record<string, string> = {
  visit: "bg-muted-foreground",
  product: "bg-accent",
  cart: "bg-primary/60",
  checkout: "bg-primary",
  paid: "bg-primary",
};

export function AdminLive({ events, now }: { events: TrackedEvent[]; now: number }) {
  const online = activeVisitors(events, now);
  const recent = [...events].sort((a, b) => b.at - a.at).slice(0, 40);
  const last30 = events.filter((e) => now - e.at <= 30 * 60_000);
  const steps = uniqueVisitorsByStep(last30);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
              <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
            </span>
            <h3 className="text-sm font-semibold text-foreground">
              {online.length} visitante{online.length === 1 ? "" : "s"} agora (últimos 5 min)
            </h3>
          </div>
          <div className="mt-4 space-y-2">
            {online.length === 0 && <p className="text-sm text-muted-foreground">Ninguém navegando no momento.</p>}
            {online.map((v) => (
              <div key={v.visitorId} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                <span className="font-mono text-xs text-muted-foreground">{v.visitorId}</span>
                <span className="text-foreground">{STEP_LABELS[v.step]}{v.label ? ` · ${v.label}` : ""}</span>
                <span className="text-xs text-muted-foreground">{timeAgo(v.at, now)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Fluxo de eventos ao vivo</h3>
          <div className="mt-3 max-h-80 space-y-1 overflow-y-auto pr-1">
            {recent.map((e) => (
              <div key={e.id} className="flex items-center gap-3 border-b border-border/50 py-1.5 text-xs">
                <span className={`size-2 rounded-full ${DOT[e.step]}`} />
                <span className="w-20 font-medium text-foreground">{STEP_LABELS[e.step]}</span>
                <span className="flex-1 truncate text-muted-foreground">{e.label ?? e.path}</span>
                <span className="text-muted-foreground">{timeAgo(e.at, now)}</span>
              </div>
            ))}
            {recent.length === 0 && <p className="text-sm text-muted-foreground">Sem eventos ainda.</p>}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 h-fit">
        <h3 className="text-sm font-semibold text-foreground">Funil (últimos 30 min)</h3>
        <div className="mt-4 space-y-3">
          {STEP_ORDER.map((step, idx) => {
            const value = steps[step];
            const prev = idx === 0 ? value : steps[STEP_ORDER[idx - 1]];
            const drop = prev ? 100 - (value / prev) * 100 : 0;
            return (
              <div key={step} className="rounded-lg bg-secondary/50 px-3 py-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{STEP_LABELS[step]}</span>
                  <span className="font-semibold text-foreground">{value}</span>
                </div>
                {idx > 0 && (
                  <p className="text-[11px] text-muted-foreground">queda de {drop.toFixed(0)}% vs etapa anterior</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
