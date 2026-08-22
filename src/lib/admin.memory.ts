import type { AdminSettings, IntegrationLog, Lead, Order, TrackedEvent } from "./admin.types";

type MemoryState = {
  events: TrackedEvent[];
  orders: Order[];
  leads: Lead[];
  logs: IntegrationLog[];
  settings: AdminSettings;
};

const DEFAULT_SETTINGS: AdminSettings = {
  utmifyEnabled: false,
  utmifyToken: "",
  fbPixelEnabled: false,
  fbPixelId: "",
  fbAccessToken: "",
  fbTestEventCode: "",
};

const g = globalThis as typeof globalThis & { __selariaAdminMemory?: MemoryState };

function state(): MemoryState {
  if (!g.__selariaAdminMemory) {
    g.__selariaAdminMemory = {
      events: [],
      orders: [],
      leads: [],
      logs: [],
      settings: { ...DEFAULT_SETTINGS },
    };
  }
  return g.__selariaAdminMemory;
}

function uid(): string {
  return `mem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function memoryRecordEvent(input: Omit<TrackedEvent, "id" | "at">): void {
  const s = state();
  s.events.unshift({ ...input, id: uid(), at: Date.now() });
  if (s.events.length > 3000) s.events.length = 3000;
}

export function memoryUpsertOrder(order: Omit<Order, "createdAt" | "updatedAt">): void {
  const s = state();
  const now = Date.now();
  const idx = s.orders.findIndex((o) => o.referenceId === order.referenceId);
  const row: Order = { ...order, createdAt: idx >= 0 ? s.orders[idx].createdAt : now, updatedAt: now };
  if (idx >= 0) s.orders[idx] = row;
  else s.orders.unshift(row);
  if (s.orders.length > 300) s.orders.length = 300;
}

export function memoryUpsertLead(input: Omit<Lead, "createdAt" | "updatedAt" | "converted">): void {
  const s = state();
  const now = Date.now();
  const idx = s.leads.findIndex((l) => l.visitorId === input.visitorId);
  const row: Lead = {
    ...input,
    converted: idx >= 0 ? s.leads[idx].converted : false,
    createdAt: idx >= 0 ? s.leads[idx].createdAt : now,
    updatedAt: now,
  };
  if (idx >= 0) s.leads[idx] = row;
  else s.leads.unshift(row);
  if (s.leads.length > 200) s.leads.length = 200;
}

export function memoryMarkLeadConverted(email: string, phone: string): void {
  const digits = (phone ?? "").replace(/\D/g, "").slice(-8);
  for (const lead of state().leads) {
    if ((email && lead.email.toLowerCase() === email.toLowerCase()) || (digits && lead.phone.includes(digits))) {
      lead.converted = true;
      lead.updatedAt = Date.now();
    }
  }
}

export function memoryGetSettings(): AdminSettings {
  return { ...state().settings };
}

export function memorySaveSettings(patch: AdminSettings): AdminSettings {
  state().settings = { ...patch };
  return memoryGetSettings();
}

export function memoryLog(provider: IntegrationLog["provider"], ok: boolean, message: string): void {
  const s = state();
  s.logs.unshift({ id: uid(), provider, ok, message: message.slice(0, 300), at: Date.now() });
  if (s.logs.length > 60) s.logs.length = 60;
}

export function memorySnapshot(now = Date.now()): {
  events: TrackedEvent[];
  orders: Order[];
  leads: Lead[];
  logs: IntegrationLog[];
  settings: AdminSettings;
} {
  const since = now - 7 * 24 * 3600_000;
  const s = state();
  return {
    events: s.events.filter((e) => e.at >= since),
    orders: [...s.orders],
    leads: [...s.leads],
    logs: [...s.logs],
    settings: memoryGetSettings(),
  };
}
