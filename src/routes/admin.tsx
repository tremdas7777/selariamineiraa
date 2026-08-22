import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { LayoutDashboard, ListOrdered, Radio, BarChart3, LogOut, RefreshCw, Plug, ShoppingCart, Store, AlertTriangle } from "lucide-react";
import { adminLogin, adminLogout, getAdminData } from "@/lib/admin.functions";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminOrders } from "@/components/admin/AdminOrders";
import { AdminLive } from "@/components/admin/AdminLive";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminAbandoned } from "@/components/admin/AdminAbandoned";
import { AdminIntegrations } from "@/components/admin/AdminIntegrations";
import { AdminZedy } from "@/components/admin/AdminZedy";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel Administrativo — Selaria Mineira" },
      { name: "description", content: "Dashboard interno com pedidos, live view do funil e análises da Selaria Mineira." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Painel Administrativo — Selaria Mineira" },
      { property: "og:description", content: "Dashboard interno com pedidos, live view do funil e análises." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Tab = "dashboard" | "orders" | "live" | "abandoned" | "analytics" | "integrations" | "zedy";

const TABS: { id: Tab; label: string; icon: typeof Radio }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Pedidos", icon: ListOrdered },
  { id: "live", label: "Live view", icon: Radio },
  { id: "abandoned", label: "Carrinhos abandonados", icon: ShoppingCart },
  { id: "analytics", label: "Análises", icon: BarChart3 },
  { id: "integrations", label: "Integrações", icon: Plug },
  { id: "zedy", label: "Checkout Zedy", icon: Store },
];

function AdminPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const login = useServerFn(adminLogin);
  const logout = useServerFn(adminLogout);
  const fetchData = useServerFn(getAdminData);

  const { data, isLoading, isError, error: queryError, refetch } = useQuery({
    queryKey: ["admin-data"],
    queryFn: () => fetchData(),
    refetchInterval: 5000,
  });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await login({ data: { password } });
      if (res.ok) {
        setPassword("");
        await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
      } else {
        setError(res.error ?? "Senha incorreta.");
      }
    } finally {
      setPending(false);
    }
  }

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando…</div>;
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-xl border border-destructive/40 bg-card p-6 text-center">
          <AlertTriangle className="mx-auto mb-4 size-8 text-destructive" />
          <h1 className="text-lg font-semibold text-foreground">Erro ao carregar o painel</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {queryError instanceof Error ? queryError.message : "Não foi possível conectar ao servidor."}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!data?.authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm rounded-xl border border-border bg-card p-6">
          <h1 className="text-lg font-semibold text-foreground">Painel administrativo</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acesso restrito à equipe da Selaria Mineira.</p>
          {data?.warnings.length ? (
            <ul className="mt-4 space-y-1 rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground">
              {data.warnings.map((w) => (
                <li key={w}>• {w}</li>
              ))}
            </ul>
          ) : null}
          {!data?.canLogin && (
            <p className="mt-3 text-sm text-destructive">
              Configure a variável <code className="font-mono">ADMIN_PASSWORD</code> no Lovable Cloud para habilitar o login.
            </p>
          )}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="Senha de acesso"
            disabled={!data?.canLogin}
            className="mt-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground disabled:opacity-60"
          />
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={pending || !password || !data?.canLogin}
            className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {pending ? "Verificando…" : "Entrar"}
          </button>
        </form>
      </div>
    );
  }

  const statusBanner = data.warnings.length > 0 && (
    <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
        <div className="space-y-1 text-sm">
          <p className="font-medium text-foreground">
            Armazenamento: {data.storage === "supabase" ? "Supabase (persistente)" : "Memória temporária"}
          </p>
          {data.warnings.map((w) => (
            <p key={w} className="text-muted-foreground">{w}</p>
          ))}
          {data.storage === "memory" && (
            <p className="text-muted-foreground">
              Para live view e pedidos persistentes, configure{" "}
              <code className="font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code>,{" "}
              <code className="font-mono text-xs">ADMIN_PASSWORD</code> e{" "}
              <code className="font-mono text-xs">ADMIN_SESSION_SECRET</code> no Lovable Cloud.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Selaria Mineira · Admin</h1>
            <p className="text-xs text-muted-foreground">Atualizando a cada 5 segundos</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-data"] })}
              className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm text-foreground hover:bg-accent/10"
            >
              <RefreshCw className="size-4" /> Atualizar
            </button>
            <button
              onClick={async () => {
                await logout();
                await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
              }}
              className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm text-foreground hover:bg-accent/10"
            >
              <LogOut className="size-4" /> Sair
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm transition-colors",
                tab === t.id
                  ? "border-primary font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="size-4" /> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {statusBanner}
        {tab === "dashboard" && <AdminDashboard events={data.events} orders={data.orders} now={data.now} />}
        {tab === "orders" && <AdminOrders orders={data.orders} now={data.now} />}
        {tab === "live" && <AdminLive events={data.events} now={data.now} />}
        {tab === "abandoned" && <AdminAbandoned leads={data.leads} now={data.now} />}
        {tab === "analytics" && <AdminAnalytics events={data.events} orders={data.orders} />}
        {tab === "integrations" && data.settings && (
          <AdminIntegrations
            settings={data.settings}
            logs={data.logs}
            now={data.now}
            onSaved={() => queryClient.invalidateQueries({ queryKey: ["admin-data"] })}
          />
        )}
        {tab === "zedy" && <AdminZedy />}
        <p className="mt-8 text-xs text-muted-foreground">
          Dados em {data.storage === "supabase" ? "Supabase" : "memória do servidor (temporário)"}. Atualização automática a cada 5 segundos.
        </p>
      </main>
    </div>
  );
}
