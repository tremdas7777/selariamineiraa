import { createServerFn } from "@tanstack/react-start";

type CartItemInput = { title: string; quantity: number };

export type StartCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; missing: string[]; error?: string };

/**
 * Cria o checkout externo da Zedy a partir do carrinho local.
 * Os produtos são casados por título com o catálogo cadastrado na Zedy;
 * os que não existirem lá são devolvidos em `missing`.
 */
export const startZedyCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: { items: CartItemInput[] }) => ({
    items: (data.items ?? []).slice(0, 50).map((i) => ({
      title: String(i.title ?? "").slice(0, 200),
      quantity: Math.max(1, Math.min(99, Math.round(Number(i.quantity) || 1))),
    })),
  }))
  .handler(async ({ data }): Promise<StartCheckoutResult> => {
    if (data.items.length === 0) return { ok: false, missing: [], error: "Carrinho vazio." };
    try {
      const { buildVariantMap, normalizeTitle, createZedyCheckout } = await import("./zedy.server");
      const map = await buildVariantMap();

      const missing: string[] = [];
      const payload: { variantId: number; quantity: number }[] = [];
      for (const item of data.items) {
        const variantId = map.get(normalizeTitle(item.title));
        if (!variantId) {
          missing.push(item.title);
          continue;
        }
        payload.push({ variantId: Number(variantId), quantity: item.quantity });
      }
      if (missing.length > 0) return { ok: false, missing };

      const res = await createZedyCheckout(payload);
      const url = res.checkoutUrl ?? res.checkout_direct_url ?? "";
      if (!url) return { ok: false, missing: [], error: res.message ?? "Zedy não retornou a URL do checkout." };
      return { ok: true, url };
    } catch (err) {
      return { ok: false, missing: [], error: err instanceof Error ? err.message : "Erro na Zedy." };
    }
  });

export type ZedyCatalogStatus = {
  ok: boolean;
  error?: string;
  matched: { title: string; variantId: string }[];
  missing: string[];
};

/** Diagnóstico para o admin: quais produtos da loja já existem no catálogo da Zedy. */
export const getZedyCatalogStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<ZedyCatalogStatus> => {
    const { isUnlocked } = await import("./admin.server");
    if (!(await isUnlocked())) return { ok: false, error: "Não autorizado.", matched: [], missing: [] };
    try {
      const { buildVariantMap, normalizeTitle } = await import("./zedy.server");
      const { products } = await import("./products");
      const map = await buildVariantMap();
      const matched: { title: string; variantId: string }[] = [];
      const missing: string[] = [];
      for (const p of products) {
        const variantId = map.get(normalizeTitle(p.name));
        if (variantId) matched.push({ title: p.name, variantId });
        else missing.push(p.name);
      }
      return { ok: true, matched, missing };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Erro na Zedy.", matched: [], missing: [] };
    }
  },
);
