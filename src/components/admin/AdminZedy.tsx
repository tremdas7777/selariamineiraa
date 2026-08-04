import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { getZedyCatalogStatus } from "@/lib/zedy.functions";

export function AdminZedy() {
  const fetchStatus = useServerFn(getZedyCatalogStatus);
  const { data, isLoading } = useQuery({
    queryKey: ["zedy-catalog"],
    queryFn: () => fetchStatus(),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Consultando o catálogo da Zedy…
      </div>
    );
  }

  if (!data?.ok) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-card p-5 text-sm text-destructive">
        {data?.error ?? "Não foi possível consultar a Zedy."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card label="Produtos prontos para vender" value={data.matched.length} tone="ok" />
        <Card label="Faltam cadastrar na Zedy" value={data.missing.length} tone="warn" />
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">Checkout externo Zedy</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          O carrinho da loja é enviado para o checkout da Zedy casando os produtos pelo título. Cadastre na Zedy,
          com o mesmo nome, os produtos listados abaixo para que possam ser vendidos.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          URL de webhook para configurar em Zedy → Configurações → Webhook:{" "}
          <span className="font-mono text-foreground">/api/public/zedy-webhook</span>
        </p>
      </section>

      {data.missing.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <AlertTriangle className="size-4 text-destructive" /> Não encontrados na Zedy
          </h3>
          <ul className="mt-3 max-h-80 space-y-1 overflow-auto text-xs text-muted-foreground">
            {data.missing.map((t) => (
              <li key={t} className="border-b border-border/50 py-1">{t}</li>
            ))}
          </ul>
        </section>
      )}

      {data.matched.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Check className="size-4 text-primary" /> Casados com a Zedy
          </h3>
          <ul className="mt-3 max-h-80 space-y-1 overflow-auto text-xs text-muted-foreground">
            {data.matched.map((m) => (
              <li key={m.variantId} className="flex justify-between gap-3 border-b border-border/50 py-1">
                <span className="truncate">{m.title}</span>
                <span className="font-mono">{m.variantId}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Card({ label, value, tone }: { label: string; value: number; tone: "ok" | "warn" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={tone === "ok" ? "mt-1 text-2xl font-semibold text-primary" : "mt-1 text-2xl font-semibold text-destructive"}>
        {value}
      </p>
    </div>
  );
}
