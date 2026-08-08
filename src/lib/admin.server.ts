// Server-only: persistência do funil/pedidos/leads/configurações no banco
// (Lovable Cloud) + sessão do admin + integrações externas (UTMify / Facebook CAPI).
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";
import type {
  AdminSettings,
  IntegrationLog,
  Lead,
  Order,
  OrderStatus,
  TrackedEvent,
} from "./admin.types";

export type { FunnelStep, Order, OrderStatus, TrackedEvent } from "./admin.types";

type Item = { title: string; quantity: number; unitPrice: number };

const DEFAULT_SETTINGS: AdminSettings = {
  utmifyEnabled: false,
  utmifyToken: "",
  fbPixelEnabled: false,
  fbPixelId: "",
  fbAccessToken: "",
  fbTestEventCode: "",
};

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function ms(value: string): number {
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : Date.now();
}

function toItems(value: unknown): Item[] {
  return Array.isArray(value) ? (value as Item[]) : [];
}

// ---------- eventos do funil ----------

export async function recordEvent(input: Omit<TrackedEvent, "id" | "at">): Promise<void> {
  try {
    const client = await db();
    await client.from("analytics_events").insert({
      step: input.step,
      visitor_id: input.visitorId,
      path: input.path,
      label: input.label ?? null,
      value: input.value ?? null,
    });
  } catch (err) {
    console.error("[admin] recordEvent", err);
  }
}

// ---------- pedidos ----------

export async function upsertOrder(order: Omit<Order, "createdAt" | "updatedAt">): Promise<void> {
  try {
    const client = await db();
    await client
      .from("store_orders")
      .upsert(
        {
          external_id: order.id,
          reference_id: order.referenceId,
          status: order.status,
          method: order.method,
          amount: Math.round(order.amount || 0),
          customer_name: order.customerName ?? "",
          customer_email: order.customerEmail ?? "",
          customer_phone: order.customerPhone ?? "",
          city: order.city ?? "",
          uf: order.uf ?? "",
          items: order.items ?? [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "reference_id" },
      );
  } catch (err) {
    console.error("[admin] upsertOrder", err);
  }
}

export async function updateOrderStatus(key: string, status: OrderStatus): Promise<boolean> {
  try {
    const client = await db();
    const { data } = await client
      .from("store_orders")
      .update({ status, updated_at: new Date().toISOString() })
      .or(`reference_id.eq.${key},external_id.eq.${key}`)
      .select("id");
    return (data?.length ?? 0) > 0;
  } catch (err) {
    console.error("[admin] updateOrderStatus", err);
    return false;
  }
}

// ---------- leads / carrinhos abandonados ----------

export async function upsertLead(
  input: Omit<Lead, "createdAt" | "updatedAt" | "converted">,
): Promise<void> {
  try {
    const client = await db();
    await client.from("store_leads").upsert(
      {
        visitor_id: input.visitorId,
        name: input.name ?? "",
        email: input.email ?? "",
        phone: input.phone ?? "",
        city: input.city ?? "",
        uf: input.uf ?? "",
        amount: Math.round(input.amount || 0),
        items: input.items ?? [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "visitor_id" },
    );
  } catch (err) {
    console.error("[admin] upsertLead", err);
  }
}

/** Marca como convertido o lead que corresponde ao e-mail/telefone do pedido. */
export async function markLeadConverted(email: string, phone: string): Promise<void> {
  try {
    const client = await db();
    const digits = (phone ?? "").replace(/\D/g, "");
    const filters: string[] = [];
    if (email) filters.push(`email.ilike.${email}`);
    if (digits) filters.push(`phone.ilike.%${digits.slice(-8)}%`);
    if (!filters.length) return;
    await client
      .from("store_leads")
      .update({ converted: true, updated_at: new Date().toISOString() })
      .or(filters.join(","));
  } catch (err) {
    console.error("[admin] markLeadConverted", err);
  }
}

// ---------- configurações das integrações ----------

export async function getSettings(): Promise<AdminSettings> {
  try {
    const client = await db();
    const { data } = await client.from("admin_settings").select("*").eq("id", "default").maybeSingle();
    if (!data) return { ...DEFAULT_SETTINGS };
    return {
      utmifyEnabled: data.utmify_enabled,
      utmifyToken: data.utmify_token,
      fbPixelEnabled: data.fb_pixel_enabled,
      fbPixelId: data.fb_pixel_id,
      fbAccessToken: data.fb_access_token,
      fbTestEventCode: data.fb_test_event_code,
    };
  } catch (err) {
    console.error("[admin] getSettings", err);
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(patch: AdminSettings): Promise<AdminSettings> {
  try {
    const client = await db();
    await client.from("admin_settings").upsert(
      {
        id: "default",
        utmify_enabled: patch.utmifyEnabled,
        utmify_token: patch.utmifyToken,
        fb_pixel_enabled: patch.fbPixelEnabled,
        fb_pixel_id: patch.fbPixelId,
        fb_access_token: patch.fbAccessToken,
        fb_test_event_code: patch.fbTestEventCode,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
  } catch (err) {
    console.error("[admin] saveSettings", err);
  }
  return getSettings();
}

async function log(provider: IntegrationLog["provider"], ok: boolean, message: string): Promise<void> {
  try {
    const client = await db();
    await client.from("integration_logs").insert({ provider, ok, message: message.slice(0, 300) });
  } catch (err) {
    console.error("[admin] log", err);
  }
}

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase(), "utf8").digest("hex");
}

/** Envia o pedido para a UTMify (se habilitada). Nunca lança. */
async function sendToUtmify(
  order: Omit<Order, "createdAt" | "updatedAt">,
  settings: AdminSettings,
): Promise<void> {
  const { utmifyEnabled, utmifyToken } = settings;
  if (!utmifyEnabled || !utmifyToken) return;
  const nowIso = new Date().toISOString().replace("T", " ").slice(0, 19);
  const body = {
    orderId: order.referenceId,
    platform: "SelariaMineira",
    paymentMethod: order.method === "PIX" ? "pix" : "credit_card",
    status:
      order.status === "APPROVED" ? "paid" : order.status === "PENDING" ? "waiting_payment" : "refused",
    createdAt: nowIso,
    approvedDate: order.status === "APPROVED" ? nowIso : null,
    refundedAt: null,
    customer: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      document: null,
      country: "BR",
      ip: null,
    },
    products: order.items.map((i, idx) => ({
      id: `item-${idx + 1}`,
      name: i.title,
      planId: null,
      planName: null,
      quantity: i.quantity,
      priceInCents: i.unitPrice,
    })),
    trackingParameters: {
      src: null, sck: null, utm_source: null, utm_campaign: null,
      utm_medium: null, utm_content: null, utm_term: null,
    },
    commission: {
      totalPriceInCents: order.amount,
      gatewayFeeInCents: 0,
      userCommissionInCents: order.amount,
    },
    isTest: false,
  };
  try {
    const res = await fetch("https://api.utmify.com.br/api-credentials/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-token": utmifyToken },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    await log("utmify", res.ok, res.ok ? `Pedido ${order.referenceId} enviado` : `[${res.status}] ${text}`);
  } catch (err) {
    await log("utmify", false, err instanceof Error ? err.message : "erro desconhecido");
  }
}

/** Envia a conversão para a API de Conversões do Facebook (se habilitada). Nunca lança. */
async function sendToFacebook(
  order: Omit<Order, "createdAt" | "updatedAt">,
  settings: AdminSettings,
): Promise<void> {
  const { fbPixelEnabled, fbPixelId, fbAccessToken, fbTestEventCode } = settings;
  if (!fbPixelEnabled || !fbPixelId || !fbAccessToken) return;
  const eventName = order.status === "APPROVED" ? "Purchase" : "InitiateCheckout";
  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: order.referenceId,
        action_source: "website",
        user_data: {
          em: [sha256(order.customerEmail)],
          ph: [sha256(order.customerPhone.replace(/\D/g, ""))],
          ct: order.city ? [sha256(order.city)] : undefined,
          st: order.uf ? [sha256(order.uf)] : undefined,
          country: [sha256("br")],
        },
        custom_data: {
          currency: "BRL",
          value: Number((order.amount / 100).toFixed(2)),
          contents: order.items.map((i) => ({
            id: i.title,
            quantity: i.quantity,
            item_price: i.unitPrice / 100,
          })),
        },
      },
    ],
  };
  if (fbTestEventCode) payload.test_event_code = fbTestEventCode;
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(fbPixelId)}/events?access_token=${encodeURIComponent(fbAccessToken)}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
    );
    const text = await res.text();
    await log("facebook", res.ok, res.ok ? `${eventName} ${order.referenceId} enviado` : `[${res.status}] ${text}`);
  } catch (err) {
    await log("facebook", false, err instanceof Error ? err.message : "erro desconhecido");
  }
}

export async function notifyIntegrations(order: Omit<Order, "createdAt" | "updatedAt">): Promise<void> {
  const settings = await getSettings();
  await Promise.all([sendToUtmify(order, settings), sendToFacebook(order, settings)]);
}

// ---------- snapshot para o painel ----------

export async function snapshot(): Promise<{
  events: TrackedEvent[];
  orders: Order[];
  leads: Lead[];
  logs: IntegrationLog[];
  settings: AdminSettings;
}> {
  const client = await db();
  const since = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();

  const [eventsRes, ordersRes, leadsRes, logsRes, settings] = await Promise.all([
    client
      .from("analytics_events")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(3000),
    client.from("store_orders").select("*").order("created_at", { ascending: false }).limit(300),
    client.from("store_leads").select("*").order("updated_at", { ascending: false }).limit(200),
    client.from("integration_logs").select("*").order("created_at", { ascending: false }).limit(60),
    getSettings(),
  ]);

  const events: TrackedEvent[] = (eventsRes.data ?? []).map((e) => ({
    id: e.id,
    step: e.step as TrackedEvent["step"],
    visitorId: e.visitor_id,
    path: e.path,
    label: e.label ?? undefined,
    value: e.value === null ? undefined : Number(e.value),
    at: ms(e.created_at),
  }));

  const orders: Order[] = (ordersRes.data ?? []).map((o) => ({
    id: o.external_id,
    referenceId: o.reference_id,
    status: o.status as OrderStatus,
    method: o.method as Order["method"],
    amount: o.amount,
    customerName: o.customer_name,
    customerEmail: o.customer_email,
    customerPhone: o.customer_phone,
    city: o.city,
    uf: o.uf,
    items: toItems(o.items),
    createdAt: ms(o.created_at),
    updatedAt: ms(o.updated_at),
  }));

  const leads: Lead[] = (leadsRes.data ?? []).map((l) => ({
    visitorId: l.visitor_id,
    name: l.name,
    email: l.email,
    phone: l.phone,
    city: l.city,
    uf: l.uf,
    amount: l.amount,
    items: toItems(l.items),
    converted: l.converted,
    createdAt: ms(l.created_at),
    updatedAt: ms(l.updated_at),
  }));

  const logs: IntegrationLog[] = (logsRes.data ?? []).map((g) => ({
    id: g.id,
    provider: g.provider as IntegrationLog["provider"],
    ok: g.ok,
    message: g.message,
    at: ms(g.created_at),
  }));

  return { events, orders, leads, logs, settings };
}

// ---------- sessão ----------

type AdminSession = { unlocked?: boolean };

function sessionConfig() {
  const password = process.env.ADMIN_SESSION_SECRET;
  if (!password) throw new Error("ADMIN_SESSION_SECRET não configurado");
  return {
    password,
    name: "selaria-admin",
    maxAge: 60 * 60 * 12,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

export async function getAdminSession() {
  return useSession<AdminSession>(sessionConfig());
}

export function passwordMatches(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function isUnlocked(): Promise<boolean> {
  const session = await getAdminSession();
  return session.data.unlocked === true;
}
