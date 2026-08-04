// Server-only: cliente da API da Loja Zedy (catálogo + criação de checkout externo).
// Docs: https://app.zedy.com.br/docs
const BASE = "https://app.zedy.com.br/api/loja/v1";

export type ZedyVariant = {
  id: string;
  title: string;
  price: number;
  availableForSale: boolean;
};

export type ZedyProduct = {
  id: string;
  handle: string;
  title: string;
  price: number;
  status: string;
  variants: ZedyVariant[];
};

function auth(): Record<string, string> {
  const token = process.env.ZEDY_API_TOKEN;
  const storeId = process.env.ZEDY_STORE_ID;
  if (!token || !storeId) throw new Error("Zedy não configurada (token/store id ausentes).");
  return {
    Authorization: `Bearer ${token}`,
    "X-Store-Id": storeId,
    "Content-Type": "application/json",
  };
}

/** Normaliza títulos para casar produtos daqui com o catálogo da Zedy. */
export function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Busca todas as páginas do catálogo da Zedy (limite de segurança: 40 páginas). */
export async function listZedyProducts(): Promise<ZedyProduct[]> {
  const all: ZedyProduct[] = [];
  for (let page = 1; page <= 40; page++) {
    const res = await fetch(`${BASE}/products?page=${page}&per_page=50`, { headers: auth() });
    if (!res.ok) throw new Error(`Zedy /products [${res.status}] ${await res.text()}`);
    const json = (await res.json()) as {
      products?: ZedyProduct[];
      pagination?: { totalPages?: number };
    };
    all.push(...(json.products ?? []));
    if (page >= (json.pagination?.totalPages ?? 1)) break;
  }
  return all;
}

/** Mapa título normalizado → variantId padrão (primeira variante disponível). */
export async function buildVariantMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const p of await listZedyProducts()) {
    const variant = p.variants?.find((v) => v.availableForSale) ?? p.variants?.[0];
    if (variant) map.set(normalizeTitle(p.title), String(variant.id));
  }
  return map;
}

export type ZedyCheckoutResult = {
  active?: boolean;
  skip_cart?: boolean;
  checkout_direct_url?: string | null;
  checkoutUrl?: string | null;
  message?: string;
};

export async function createZedyCheckout(
  items: { variantId: number; quantity: number }[],
): Promise<ZedyCheckoutResult> {
  const res = await fetch(`${BASE}/cart/create-checkout`, {
    method: "POST",
    headers: auth(),
    body: JSON.stringify({ items }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Zedy checkout [${res.status}] ${text}`);
  return JSON.parse(text) as ZedyCheckoutResult;
}
