// Server-only helper for Legacy Ecom Brasil payment gateway.
// Docs: https://developers.legacyecombrasil.com/docs/inicio-rapido

export type LegacyPayinResult = {
  ok: boolean;
  status: number;
  data: Record<string, unknown> & { id?: string; message?: string; code?: string };
};

export async function callLegacyPayin(payload: unknown): Promise<LegacyPayinResult> {
  const pk = process.env.LEGACY_PAY_PUBLIC_KEY;
  const sk = process.env.LEGACY_PAY_SECRET_KEY;
  if (!pk || !sk) {
    return {
      ok: false,
      status: 500,
      data: { code: "MISSING_KEYS", message: "Chaves da Legacy não configuradas." },
    };
  }
  const auth = Buffer.from(`${pk}:${sk}`).toString("base64");
  try {
    const res = await fetch("https://api.legacyecombrasil.com/payin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return {
      ok: false,
      status: 502,
      data: { code: "NETWORK_ERROR", message: (err as Error).message },
    };
  }
}
