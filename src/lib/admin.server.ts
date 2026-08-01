// Server-only: armazenamento em memória do funil/pedidos/leads + sessão do admin
// + envio para integrações externas (UTMify e Facebook Conversions API).
// OBS: enquanto o Lovable Cloud não estiver ativo, os dados vivem apenas na
// memória do servidor (são perdidos em cada novo deploy/reinício).
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

type Store = {
  events: TrackedEvent[];
  orders: Order[];
  leads: Lead[];
  logs: IntegrationLog[];
  settings: AdminSettings;
};

const MAX_EVENTS = 5000;
const MAX_ORDERS = 1000;
const MAX_LEADS = 500;
const MAX_LOGS = 200;

const DEFAULT_SETTINGS: AdminSettings = {
  utmifyEnabled: false,
  utmifyToken: "",
  fbPixelEnabled: false,
  fbPixelId: "",
  fbAccessToken: "",
  fbTestEventCode: "",
};

const globalStore = globalThis as unknown as { __selariaAdminStore?: Store };

function store(): Store {
  if (!globalStore.__selariaAdminStore) {
    globalStore.__selariaAdminStore = {
      events: [],
      orders: [],
      leads: [],
      logs: [],
      settings: { ...DEFAULT_SETTINGS },
    };
  }
  return globalStore.__selariaAdminStore;
}

export function recordEvent(input: Omit<TrackedEvent, "id" | "at">): void {
  const s = store();
  s.events.push({
    ...input,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
  });
  if (s.events.length > MAX_EVENTS) s.events.splice(0, s.events.length - MAX_EVENTS);
}

export function upsertOrder(order: Omit<Order, "createdAt" | "updatedAt">): void {
  const s = store();
  const now = Date.now();
  const existing = s.orders.find((o) => o.referenceId === order.referenceId);
  if (existing) {
    Object.assign(existing, order, { updatedAt: now });
    return;
  }
  s.orders.unshift({ ...order, createdAt: now, updatedAt: now });
  if (s.orders.length > MAX_ORDERS) s.orders.length = MAX_ORDERS;
}

export function updateOrderStatus(key: string, status: OrderStatus): boolean {
  const s = store();
  const found = s.orders.find((o) => o.referenceId === key || o.id === key);
  if (!found) return false;
  found.status = status;
  found.updatedAt = Date.now();
  return true;
}

// ---------- leads / carrinhos abandonados ----------

export function upsertLead(input: Omit<Lead, "createdAt" | "updatedAt" | "converted">): void {
  const s = store();
  const now = Date.now();
  const existing = s.leads.find((l) => l.visitorId === input.visitorId);
  if (existing) {
    Object.assign(existing, input, { updatedAt: now });
    return;
  }
  s.leads.unshift({ ...input, converted: false, createdAt: now, updatedAt: now });
  if (s.leads.length > MAX_LEADS) s.leads.length = MAX_LEADS;
}

/** Marca como convertido o lead que corresponde ao e-mail/telefone do pedido. */
export function markLeadConverted(email: string, phone: string): void {
  const s = store();
  const digits = (v: string) => v.replace(/\D/g, "");
  for (const l of s.leads) {
    if (
      (email && l.email.toLowerCase() === email.toLowerCase()) ||
      (phone && digits(l.phone) === digits(phone))
    ) {
      l.converted = true;
      l.updatedAt = Date.now();
    }
  }
}

// ---------- configurações das integrações ----------

export function getSettings(): AdminSettings {
  return { ...store().settings };
}

export function saveSettings(patch: Partial<AdminSettings>): AdminSettings {
  const s = store();
  s.settings = { ...s.settings, ...patch };
  return { ...s.settings };
}

function log(provider: IntegrationLog["provider"], ok: boolean, message: string): void {
  const s = store();
  s.logs.unshift({
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    provider,
    ok,
    message: message.slice(0, 300),
    at: Date.now(),
  });
  if (s.logs.length > MAX_LOGS) s.logs.length = MAX_LOGS;
}

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase(), "utf8").digest("hex");
}

/** Envia o pedido para a UTMify (se habilitada). Nunca lança. */
async function sendToUtmify(order: Omit<Order, "createdAt" | "updatedAt">): Promise<void> {
  const { utmifyEnabled, utmifyToken } = store().settings;
  if (!utmifyEnabled || !utmifyToken) return;
  const nowIso = new Date().toISOString().replace("T", " ").slice(0, 19);
  const body = {
    orderId: order.referenceId,
    platform: "SelariaMineira",
    paymentMethod: order.method === "PIX" ? "pix" : "credit_card",
    status: order.status === "APPROVED" ? "paid" : order.status === "PENDING" ? "waiting_payment" : "refused",
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
    commission: { totalPriceInCents: order.amount, gatewayFeeInCents: 0, userCommissionInCents: order.amount },
    isTest: false,
  };
  try {
    const res = await fetch("https://api.utmify.com.br/api-credentials/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-token": utmifyToken },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    log("utmify", res.ok, res.ok ? `Pedido ${order.referenceId} enviado` : `[${res.status}] ${text}`);
  } catch (err) {
    log("utmify", false, err instanceof Error ? err.message : "erro desconhecido");
  }
}

/** Envia a conversão para a API de Conversões do Facebook (se habilitada). Nunca lança. */
async function sendToFacebook(order: Omit<Order, "createdAt" | "updatedAt">): Promise<void> {
  const { fbPixelEnabled, fbPixelId, fbAccessToken, fbTestEventCode } = store().settings;
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
          contents: order.items.map((i) => ({ id: i.title, quantity: i.quantity, item_price: i.unitPrice / 100 })),
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
    log("facebook", res.ok, res.ok ? `${eventName} ${order.referenceId} enviado` : `[${res.status}] ${text}`);
  } catch (err) {
    log("facebook", false, err instanceof Error ? err.message : "erro desconhecido");
  }
}

export async function notifyIntegrations(order: Omit<Order, "createdAt" | "updatedAt">): Promise<void> {
  await Promise.all([sendToUtmify(order), sendToFacebook(order)]);
}

export function snapshot() {
  const s = store();
  return {
    events: s.events.slice(-1200),
    orders: s.orders.slice(0, 300),
    leads: s.leads.slice(0, 200),
    logs: s.logs.slice(0, 60),
    settings: { ...s.settings },
  };
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
