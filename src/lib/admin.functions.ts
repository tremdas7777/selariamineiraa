import { createServerFn } from "@tanstack/react-start";
import type { FunnelStep, Order, OrderStatus, TrackedEvent } from "./admin.types";

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
    recordEvent(data);
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
    const { upsertOrder } = await import("./admin.server");
    upsertOrder({
      ...data,
      customerName: String(data.customerName).slice(0, 120),
      customerEmail: String(data.customerEmail).slice(0, 160),
      items: (data.items ?? []).slice(0, 50),
    });
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

export type AdminData = {
  authorized: boolean;
  events: TrackedEvent[];
  orders: Order[];
  now: number;
};

export const getAdminData = createServerFn({ method: "GET" }).handler(async (): Promise<AdminData> => {
  const { isUnlocked, snapshot } = await import("./admin.server");
  if (!(await isUnlocked())) {
    return { authorized: false, events: [], orders: [], now: Date.now() };
  }
  const snap = snapshot();
  return { authorized: true, events: snap.events, orders: snap.orders, now: Date.now() };
});
