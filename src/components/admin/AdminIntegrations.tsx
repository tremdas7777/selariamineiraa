import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, Save } from "lucide-react";
import type { AdminSettings, IntegrationLog } from "@/lib/admin.types";
import { updateSettings } from "@/lib/admin.functions";
import { timeAgo } from "./admin-utils";
import { cn } from "@/lib/utils";

export function AdminIntegrations({
  settings,
  logs,
  now,
  onSaved,
}: {
  settings: AdminSettings;
  logs: IntegrationLog[];
  now: number;
  onSaved: () => void;
}) {
  const save = useServerFn(updateSettings);
  const [form, setForm] = useState<AdminSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof AdminSettings>(k: K, v: AdminSettings[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await save({ data: form });
      setSaved(true);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <Header
            title="UTMify"
            description="Envia cada pedido (pendente, aprovado ou recusado) para a UTMify com os produtos e o valor."
            enabled={form.utmifyEnabled}
            onToggle={(v) => set("utmifyEnabled", v)}
          />
          <Field
            label="API Token (x-api-token)"
            value={form.utmifyToken}
            onChange={(v) => set("utmifyToken", v)}
            placeholder="Cole aqui o token de credencial da UTMify"
            secret
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Encontre em UTMify → Integrações → Credenciais de API.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <Header
            title="Facebook Pixel + API de Conversões"
            description="Carrega o pixel na loja e envia as conversões server-side (Purchase / InitiateCheckout) com dados hasheados."
            enabled={form.fbPixelEnabled}
            onToggle={(v) => set("fbPixelEnabled", v)}
          />
          <Field label="Pixel ID" value={form.fbPixelId} onChange={(v) => set("fbPixelId", v)} placeholder="1234567890" />
          <Field
            label="Token de acesso (Conversions API)"
            value={form.fbAccessToken}
            onChange={(v) => set("fbAccessToken", v)}
            placeholder="EAAG..."
            secret
          />
          <Field
            label="Código de teste (opcional)"
            value={form.fbTestEventCode}
            onChange={(v) => set("fbTestEventCode", v)}
            placeholder="TEST12345"
          />
        </section>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Salvar integrações
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-primary">
            <Check className="size-4" /> Salvo
          </span>
        )}
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">Últimos envios</h3>
        <div className="mt-3 space-y-1">
          {logs.length === 0 && <p className="text-sm text-muted-foreground">Nenhum envio registrado ainda.</p>}
          {logs.map((l) => (
            <div key={l.id} className="flex items-center gap-3 border-b border-border/50 py-1.5 text-xs">
              <span className={cn("size-2 rounded-full", l.ok ? "bg-primary" : "bg-destructive")} />
              <span className="w-20 font-medium text-foreground">{l.provider === "utmify" ? "UTMify" : "Facebook"}</span>
              <span className="flex-1 truncate text-muted-foreground">{l.message}</span>
              <span className="text-muted-foreground">{timeAgo(l.at, now)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Header({
  title, description, enabled, onToggle,
}: { title: string; description: string; enabled: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={`Ativar ${title}`}
        onClick={() => onToggle(!enabled)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          enabled ? "bg-primary" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-card transition-all",
            enabled ? "left-[22px]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, secret,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; secret?: boolean }) {
  return (
    <label className="mt-3 block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={secret ? "password" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
      />
    </label>
  );
}
