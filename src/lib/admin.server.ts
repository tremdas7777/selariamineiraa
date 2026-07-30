// Server-only: armazenamento em memória do funil/pedidos + sessão do admin.
// OBS: enquanto o Lovable Cloud não estiver ativo, os dados vivem apenas na
// memória do servidor (são perdidos em cada novo deploy/reinício).
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

export type FunnelStep = "visit" | "product" | "cart" | "checkout" | "paid";

export type TrackedEvent = {
  id: string;
  step: FunnelStep;
  visitorId: string;
  path: string;
  label?: string;
  value?: number;
  at: number;
};

export type OrderStatus = "PENDING" | "APPROVED" | "FAILED" | "REFUNDED";

export type Order = {
  id: string;
  referenceId: string;
  status: OrderStatus;
  method: "PIX" | "CREDIT_CARD";
  amount: number; // centavos
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  city: string;
  uf: string;
  items: { title: string; quantity: number; unitPrice: number }[];
  createdAt: number;
  updatedAt: number;
};

type Store = { events: TrackedEvent[]; orders: Order[] };

const MAX_EVENTS = 5000;
const MAX_ORDERS = 1000;

const globalStore = globalThis as unknown as { __selariaAdminStore?: Store };

function store(): Store {
  if (!globalStore.__selariaAdminStore) {
    globalStore.__selariaAdminStore = { events: [], orders: [] };
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

export function snapshot(): Store {
  const s = store();
  return { events: s.events.slice(-1200), orders: s.orders.slice(0, 300) };
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
