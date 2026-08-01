import type { Lead } from "@/lib/admin.types";
import { brl, timeAgo } from "./admin-utils";

/** Lista os checkouts iniciados que ainda não viraram pedido. */
export function AdminAbandoned({ leads, now }: { leads: Lead[]; now: number }) {
  const abandoned = leads.filter((l) => !l.converted).sort((a, b) => b.updatedAt - a.updatedAt);
  const recovered = leads.filter((l) => l.converted).length;
  const potential = abandoned.reduce((s, l) => s + l.amount, 0);
  const rate = leads.length ? (recovered / leads.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Carrinhos abandonados" value={String(abandoned.length)} />
        <Kpi label="Valor em aberto" value={brl(potential)} />
        <Kpi label="Taxa de conversão do checkout" value={`${rate.toFixed(0)}%`} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Contato</th>
              <th className="px-4 py-3">Itens</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Abandonado</th>
            </tr>
          </thead>
          <tbody>
            {abandoned.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum carrinho abandonado no momento.
                </td>
              </tr>
            )}
            {abandoned.map((l) => (
              <tr key={l.visitorId} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3 text-foreground">
                  {l.name || <span className="text-muted-foreground">sem nome</span>}
                  {l.city && <span className="block text-xs text-muted-foreground">{l.city}/{l.uf}</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <span className="block">{l.email || "—"}</span>
                  <span className="block text-xs">{l.phone || "—"}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {l.items.map((i) => `${i.quantity}x ${i.title}`).join(", ") || "—"}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{brl(l.amount)}</td>
                <td className="px-4 py-3 text-muted-foreground">{timeAgo(l.updatedAt, now)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
