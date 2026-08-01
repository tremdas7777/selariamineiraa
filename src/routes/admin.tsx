import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { LayoutDashboard, ListOrdered, Radio, BarChart3, LogOut, RefreshCw, Plug, ShoppingCart } from "lucide-react";
import { adminLogin, adminLogout, getAdminData } from "@/lib/admin.functions";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminOrders } from "@/components/admin/AdminOrders";
import { AdminLive } from "@/components/admin/AdminLive";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminAbandoned } from "@/components/admin/AdminAbandoned";
import { AdminIntegrations } from "@/components/admin/AdminIntegrations";
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

type Tab = "dashboard" | "orders" | "live" | "abandoned" | "analytics" | "integrations";

const TABS: { id: Tab; label: string; icon: typeof Radio }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Pedidos", icon: ListOrdered },
  { id: "live", label: "Live view", icon: Radio },
  { id: "abandoned", label: "Carrinhos abandonados", icon: ShoppingCart },
  { id: "analytics", label: "Análises", icon: BarChart3 },
  { id: "integrations", label: "Integrações", icon: Plug },
];

function AdminPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  const login = useServerFn(adminLogin);
  const logout = useServerFn(adminLogout);
  const fetchData = useServerFn(getAdminData);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-data"],
    queryFn: () => fetchData(),
    refetchInterval: 5000,
  });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(false);
    try {
      const res = await login({ data: { password } });
      if (res.ok) {
        setPassword("");
        await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
      } else {
        setError(true);
      }
    } finally {
      setPending(false);
    }
  }

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando…</div>;
  }

  if (!data?.authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm rounded-xl border border-border bg-card p-6">
          <h1 className="text-lg font-semibold text-foreground">Painel administrativo</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acesso restrito à equipe da Selaria Mineira.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="Senha de acesso"
            className="mt-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
          {error && <p className="mt-2 text-sm text-destructive">Senha incorreta.</p>}
          <button
            type="submit"
            disabled={pending || !password}
            className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {pending ? "Verificando…" : "Entrar"}
          </button>
        </form>
      </div>
    );
  }

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
        {tab === "dashboard" && <AdminDashboard events={data.events} orders={data.orders} now={data.now} />}
        {tab === "orders" && <AdminOrders orders={data.orders} now={data.now} />}
        {tab === "live" && <AdminLive events={data.events} now={data.now} />}
        {tab === "analytics" && <AdminAnalytics events={data.events} orders={data.orders} />}
        <p className="mt-8 text-xs text-muted-foreground">
          Os dados são mantidos na memória do servidor e reiniciam a cada novo deploy. Ao ativar o Lovable Cloud, migramos para o banco.
        </p>
      </main>
    </div>
  );
}
