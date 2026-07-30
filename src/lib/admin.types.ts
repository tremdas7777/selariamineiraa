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
