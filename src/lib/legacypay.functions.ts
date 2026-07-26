import { createServerFn } from "@tanstack/react-start";
import { getRequestIP, getRequestHost } from "@tanstack/react-start/server";
import { callLegacyPayin } from "./legacypay.server";

type Address = {
  street: string;
  number: string;
  zipCode: string;
  city: string;
  state: string;
  complement?: string;
  neighborhood?: string;
};

type Customer = {
  name: string;
  document: string;
  email: string;
  phone: string;
  address: Address;
};

type Item = { title: string; quantity: number; unitPrice: number };

type ThreeDS = { referenceId?: string; cavv?: string; eci?: string };

type CardInput = {
  token?: string;
  holderName?: string;
  number?: string;
  expirationMonth?: string;
  expirationYear?: string;
  cvv?: string;
  installments: number;
  threeDSecure?: ThreeDS;
};

type CreatePayinInput = {
  paymentMethod: "PIX" | "CREDIT_CARD";
  amount: number;
  referenceId: string;
  customer: Customer;
  items: Item[];
  isPhysicalProduct?: boolean;
  card?: CardInput;
  antifraud?: { sessionId: string };
};

export const createPayin = createServerFn({ method: "POST" })
  .inputValidator((data: CreatePayinInput) => data)
  .handler(async ({ data }) => {
    const ip = getRequestIP({ xForwardedFor: true }) || "0.0.0.0";
    const host = getRequestHost() || "selariamineiraa.lovable.app";
    const origin = `https://${host}`;
    const payload = {
      ...data,
      payerIp: ip,
      isPhysicalProduct: data.isPhysicalProduct ?? true,
      webhookUrl: `${origin}/api/public/legacy-webhook`,
    };
    return await callLegacyPayin(payload);
  });

export const getLegacyPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  return { publicKey: process.env.LEGACY_PAY_PUBLIC_KEY ?? "" };
});
