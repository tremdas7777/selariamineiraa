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
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  city: string;
  uf: string;
  items: { title: string; quantity: number; unitPrice: number }[];
  createdAt: number;
  updatedAt: number;
};

/** Checkout iniciado e não finalizado (carrinho abandonado). */
export type Lead = {
  visitorId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  uf: string;
  amount: number; // centavos
  items: { title: string; quantity: number; unitPrice: number }[];
  converted: boolean;
  createdAt: number;
  updatedAt: number;
};

export type AdminSettings = {
  utmifyEnabled: boolean;
  utmifyToken: string;
  fbPixelEnabled: boolean;
  fbPixelId: string;
  fbAccessToken: string;
  fbTestEventCode: string;
};

/** Log de envio para integrações externas (UTMify / Facebook CAPI). */
export type IntegrationLog = {
  id: string;
  provider: "utmify" | "facebook";
  ok: boolean;
  message: string;
  at: number;
};
