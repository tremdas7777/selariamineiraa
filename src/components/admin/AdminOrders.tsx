import type { Order } from "@/lib/admin.types";
import { brl, timeAgo } from "./admin-utils";

const STATUS_STYLE: Record<Order["status"], string> = {
  APPROVED: "bg-primary/15 text-primary",
  PENDING: "bg-accent/15 text-accent",
  FAILED: "bg-destructive/15 text-destructive",
  REFUNDED: "bg-muted text-muted-foreground",
};

export function AdminOrders({ orders, now }: { orders: Order[]; now: number }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Nenhum pedido registrado ainda.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Pedido</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Itens</th>
            <th className="px-4 py-3">Pagamento</th>
            <th className="px-4 py-3">Valor</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Quando</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.referenceId} className="border-t border-border/70 align-top">
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{o.referenceId}</td>
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{o.customerName}</p>
                <p className="text-xs text-muted-foreground">{o.customerEmail}</p>
                <p className="text-xs text-muted-foreground">{o.city}/{o.uf}</p>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {o.items.map((i, idx) => (
                  <div key={idx}>{i.quantity}× {i.title}</div>
                ))}
              </td>
              <td className="px-4 py-3 text-xs">{o.method === "PIX" ? "PIX" : "Cartão"}</td>
              <td className="px-4 py-3 font-semibold text-foreground">{brl(o.amount)}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLE[o.status]}`}>
                  {o.status}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{timeAgo(o.createdAt, now)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
