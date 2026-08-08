import { createServerFn } from "@tanstack/react-start";
import type {
  AdminSettings,
  FunnelStep,
  IntegrationLog,
  Lead,
  Order,
  OrderStatus,
  TrackedEvent,
} from "./admin.types";

type TrackInput = {
  step: FunnelStep;
  visitorId: string;
  path: string;
  label?: string;
  value?: number;
};

export const trackEvent = createServerFn({ method: "POST" })
  .inputValidator((data: TrackInput) => {
    const steps: FunnelStep[] = ["visit", "product", "cart", "checkout", "paid"];
    if (!steps.includes(data.step)) throw new Error("step inválido");
    return {
      step: data.step,
      visitorId: String(data.visitorId).slice(0, 64),
      path: String(data.path).slice(0, 200),
      label: data.label ? String(data.label).slice(0, 120) : undefined,
      value: typeof data.value === "number" && Number.isFinite(data.value) ? data.value : undefined,
    };
  })
  .handler(async ({ data }) => {
    const { recordEvent } = await import("./admin.server");
    await recordEvent(data);
    return { ok: true as const };
  });

type OrderInput = {
  id: string;
  referenceId: string;
  status: OrderStatus;
  method: "PIX" | "CREDIT_CARD";
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  city: string;
  uf: string;
  items: { title: string; quantity: number; unitPrice: number }[];
};

export const recordOrder = createServerFn({ method: "POST" })
  .inputValidator((data: OrderInput) => data)
  .handler(async ({ data }) => {
    const { upsertOrder, markLeadConverted, notifyIntegrations } = await import("./admin.server");
    const order = {
      ...data,
      customerName: String(data.customerName).slice(0, 120),
      customerEmail: String(data.customerEmail).slice(0, 160),
      items: (data.items ?? []).slice(0, 50),
    };
    await upsertOrder(order);
    await markLeadConverted(order.customerEmail, order.customerPhone);
    await notifyIntegrations(order);
    return { ok: true as const };
  });

type LeadInput = {
  visitorId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  uf: string;
  amount: number;
  items: { title: string; quantity: number; unitPrice: number }[];
};

/** Salva os dados parciais do checkout para acompanhar carrinhos abandonados. */
export const saveLead = createServerFn({ method: "POST" })
  .inputValidator((data: LeadInput) => ({
    visitorId: String(data.visitorId ?? "").slice(0, 64),
    name: String(data.name ?? "").slice(0, 120),
    email: String(data.email ?? "").slice(0, 160),
    phone: String(data.phone ?? "").slice(0, 40),
    city: String(data.city ?? "").slice(0, 80),
    uf: String(data.uf ?? "").slice(0, 2),
    amount: Number.isFinite(data.amount) ? Math.max(0, Math.round(data.amount)) : 0,
    items: (data.items ?? []).slice(0, 50),
  }))
  .handler(async ({ data }) => {
    if (!data.visitorId) return { ok: false as const };
    const { upsertLead } = await import("./admin.server");
    upsertLead(data);
    return { ok: true as const };
  });

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => ({ password: String(data.password ?? "") }))
  .handler(async ({ data }) => {
    const { passwordMatches, getAdminSession } = await import("./admin.server");
    if (!passwordMatches(data.password)) return { ok: false as const };
    const session = await getAdminSession();
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { getAdminSession } = await import("./admin.server");
  const session = await getAdminSession();
  await session.clear();
  return { ok: true as const };
});

export const updateSettings = createServerFn({ method: "POST" })
  .inputValidator((data: Partial<AdminSettings>) => data)
  .handler(async ({ data }): Promise<{ ok: boolean; settings?: AdminSettings }> => {
    const { isUnlocked, saveSettings } = await import("./admin.server");
    if (!(await isUnlocked())) return { ok: false };
    const settings = saveSettings({
      utmifyEnabled: Boolean(data.utmifyEnabled),
      utmifyToken: String(data.utmifyToken ?? "").slice(0, 400),
      fbPixelEnabled: Boolean(data.fbPixelEnabled),
      fbPixelId: String(data.fbPixelId ?? "").slice(0, 64),
      fbAccessToken: String(data.fbAccessToken ?? "").slice(0, 600),
      fbTestEventCode: String(data.fbTestEventCode ?? "").slice(0, 40),
    });
    return { ok: true, settings };
  });

/** Somente o ID público do pixel, para carregar o fbq na vitrine. */
export const getPublicPixel = createServerFn({ method: "GET" }).handler(async () => {
  const { getSettings } = await import("./admin.server");
  const s = getSettings();
  return { pixelId: s.fbPixelEnabled ? s.fbPixelId : "" };
});

export type AdminData = {
  authorized: boolean;
  events: TrackedEvent[];
  orders: Order[];
  leads: Lead[];
  logs: IntegrationLog[];
  settings: AdminSettings | null;
  now: number;
};

const EMPTY_DATA = (): AdminData => ({
  authorized: false, events: [], orders: [], leads: [], logs: [], settings: null, now: Date.now(),
});

export const getAdminData = createServerFn({ method: "GET" }).handler(async (): Promise<AdminData> => {
  const { isUnlocked, snapshot } = await import("./admin.server");
  if (!(await isUnlocked())) return EMPTY_DATA();
  const snap = snapshot();
  return {
    authorized: true,
    events: snap.events,
    orders: snap.orders,
    leads: snap.leads,
    logs: snap.logs,
    settings: snap.settings,
    now: Date.now(),
  };
});
