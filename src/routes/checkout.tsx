import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState, type FormEvent, type InputHTMLAttributes } from "react";
import { CreditCard, QrCode, Lock, Check, Sparkles, Loader2, Copy, AlertCircle } from "lucide-react";
import { StoreLayout } from "@/components/StoreLayout";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/products";
import { createPayin, getLegacyPublicKey } from "@/lib/legacypay.functions";
import {
  maskCPF, maskPhone, maskCEP, maskCard, maskCardExp, maskCVV,
  isValidCPF, isValidCEP, isValidPhone, fetchCEP,
} from "@/lib/masks";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Selaria Mineira" },
      { name: "description", content: "Finalize seu pedido com segurança na Selaria Mineira." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type PayMethod = "pix" | "card";

const ENGRAVING_PRICE = 0;
const isSela = (name: string) => /\bsela\b/i.test(name);
const SDK_URL = "https://api.legacyecombrasil.com/checkout/sdk/legacy-pay.js";
const API_BASE = "https://api.legacyecombrasil.com";

type FormState = {
  email: string; phone: string; name: string; cpf: string;
  cep: string; city: string; uf: string; address: string;
  number: string; complement: string; neighborhood: string;
  cardNumber: string; cardName: string; cardExp: string; cardCvv: string;
};

const initialForm: FormState = {
  email: "", phone: "", name: "", cpf: "",
  cep: "", city: "", uf: "", address: "",
  number: "", complement: "", neighborhood: "",
  cardNumber: "", cardName: "", cardExp: "", cardCvv: "",
};

type PixResult = { id: string; qrcode: string; amount: number };
type CardResult = { id: string; status: string; amount: number };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { LegacyPay?: any } }

let sdkPromise: Promise<void> | null = null;
function loadSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.LegacyPay) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SDK_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Falha ao carregar SDK Legacy Pay"));
    document.head.appendChild(s);
  });
  return sdkPromise;
}

function CheckoutPage() {
  const { items, subtotal, count, clear } = useCart();
  const navigate = useNavigate();
  const [method, setMethod] = useState<PayMethod>("pix");
  const [engravings, setEngravings] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [installments, setInstallments] = useState(1);

  const [processing, setProcessing] = useState(false);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [pixResult, setPixResult] = useState<PixResult | null>(null);
  const [cardResult, setCardResult] = useState<CardResult | null>(null);
  const [copied, setCopied] = useState(false);

  const createPayinFn = useServerFn(createPayin);
  const getPkFn = useServerFn(getLegacyPublicKey);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientRef = useRef<any>(null);

  const selaItems = useMemo(() => items.filter((i) => isSela(i.name)), [items]);
  const engravingCount = selaItems.reduce(
    (sum, i) => sum + (engravings[i.slug]?.trim() ? i.qty : 0), 0,
  );
  const engravingTotal = engravingCount * ENGRAVING_PRICE;

  const frete = subtotal > 0 && subtotal < 399 ? 29.9 : 0;
  const baseTotal = subtotal + frete + engravingTotal;
  const total = method === "pix" ? baseTotal * 0.9 : baseTotal;
  const amountCents = Math.round(total * 100);

  // Prewarm SDK when card selected
  useEffect(() => {
    if (method !== "card") return;
    loadSdk().then(async () => {
      if (clientRef.current) return;
      const { publicKey } = await getPkFn();
      if (!publicKey) return;
      clientRef.current = window.LegacyPay!.init({ publicKey, apiBaseUrl: API_BASE });
    }).catch(() => { /* handled at submit */ });
  }, [method, getPkFn]);

  const update = (k: keyof FormState, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const handleCepBlur = async () => {
    setCepError(null);
    if (!isValidCEP(form.cep)) return;
    setCepLoading(true);
    const data = await fetchCEP(form.cep);
    setCepLoading(false);
    if (!data) { setCepError("CEP não encontrado"); return; }
    setForm((p) => ({
      ...p,
      address: data.logradouro || p.address,
      neighborhood: data.bairro || p.neighborhood,
      city: data.localidade || p.city,
      uf: data.uf || p.uf,
    }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "E-mail inválido";
    if (!isValidPhone(form.phone)) e.phone = "Telefone inválido";
    if (form.name.trim().length < 3) e.name = "Informe o nome completo";
    if (!isValidCPF(form.cpf)) e.cpf = "CPF inválido";
    if (!isValidCEP(form.cep)) e.cep = "CEP inválido";
    if (!form.address.trim()) e.address = "Obrigatório";
    if (!form.number.trim()) e.number = "Obrigatório";
    if (!form.city.trim()) e.city = "Obrigatório";
    if (method === "card") {
      if (form.cardNumber.replace(/\s/g, "").length < 13) e.cardNumber = "Número inválido";
      if (form.cardName.trim().length < 3) e.cardName = "Obrigatório";
      if (form.cardExp.length !== 5) e.cardExp = "MM/AA";
      if (form.cardCvv.length < 3) e.cardCvv = "CVV";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildCustomer = () => {
    const phone = form.phone.replace(/\D/g, "");
    return {
      name: form.name.trim(),
      document: form.cpf.replace(/\D/g, ""),
      email: form.email.trim(),
      phone: phone.startsWith("55") ? phone : `55${phone}`,
      address: {
        street: form.address.trim(),
        number: form.number.trim(),
        zipCode: form.cep,
        city: form.city.trim(),
        state: form.uf.trim().toUpperCase(),
        complement: form.complement.trim() || undefined,
        neighborhood: form.neighborhood.trim() || undefined,
      },
    };
  };

  const buildItems = () => items.map((i) => ({
    title: i.name,
    quantity: i.qty,
    unitPrice: Math.round(i.price * 100),
  }));

  const referenceId = useMemo(
    () => `pedido-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    [],
  );

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setGatewayError(null);
    if (!validate()) {
      const first = document.querySelector<HTMLElement>("[data-error='true']");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setProcessing(true);
    try {
      const customer = buildCustomer();
      const its = buildItems();

      if (method === "pix") {
        const res = await createPayinFn({
          data: {
            paymentMethod: "PIX",
            amount: amountCents,
            referenceId,
            customer,
            items: its,
            isPhysicalProduct: true,
          },
        });
        if (!res.ok) {
          const msg = (res.data && (res.data.message || res.data.code)) || `Erro ${res.status}`;
          throw new Error(String(msg));
        }
        const qrcode: string = res.data?.pix?.qrcode ?? "";
        if (!qrcode) throw new Error("Gateway não retornou o código PIX.");
        setPixResult({ id: res.data.id, qrcode, amount: res.data.amount });
        clear();
      } else {
        // CARTÃO — usa SDK legacy-pay para tokenizar + 3DS
        await loadSdk();
        if (!clientRef.current) {
          const { publicKey } = await getPkFn();
          if (!publicKey) throw new Error("Chave pública indisponível.");
          clientRef.current = window.LegacyPay!.init({ publicKey, apiBaseUrl: API_BASE });
        }
        const [expMonth, expYearShort] = form.cardExp.split("/");
        const expirationYear = expYearShort.length === 2 ? `20${expYearShort}` : expYearShort;

        const prepared = await clientRef.current.prepareCardPayment({
          amount: amountCents,
          referenceId,
          installments,
          card: {
            holderName: form.cardName.trim(),
            number: form.cardNumber.replace(/\s/g, ""),
            expirationMonth: expMonth,
            expirationYear,
            cvv: form.cardCvv,
          },
          customer,
        });

        const res = await createPayinFn({
          data: {
            paymentMethod: "CREDIT_CARD",
            amount: amountCents,
            referenceId,
            customer,
            items: its,
            isPhysicalProduct: true,
            card: {
              token: prepared.payinCard.token,
              installments: prepared.payinCard.installments ?? installments,
              threeDSecure: prepared.payinCard.threeDSecure,
            },
            antifraud: prepared.antifraud?.sessionId
              ? { sessionId: prepared.antifraud.sessionId }
              : undefined,
          },
        });
        if (!res.ok) {
          const msg = (res.data && (res.data.message || res.data.code)) || `Erro ${res.status}`;
          throw new Error(String(msg));
        }
        setCardResult({
          id: res.data.id,
          status: res.data.status,
          amount: res.data.amount,
        });
        if (res.data.status === "APPROVED") clear();
      }
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code === "THREEDS_FAILED") {
        setGatewayError("Falha na autenticação 3DS do banco. Tente outro cartão.");
      } else {
        setGatewayError(e.message || "Erro ao processar pagamento.");
      }
    } finally {
      setProcessing(false);
    }
  };

  // ==== TELAS DE RESULTADO ====

  if (pixResult) {
    const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(pixResult.qrcode)}`;
    return (
      <StoreLayout>
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="size-16 rounded-full bg-accent/10 grid place-items-center mx-auto mb-5">
            <QrCode className="size-8 text-accent" />
          </div>
          <h1 className="text-3xl font-black mb-2" style={{ fontFamily: "Playfair Display, serif" }}>Pague com PIX</h1>
          <p className="text-muted-foreground mb-6">Aponte a câmera do seu banco ou copie o código abaixo. O pedido é confirmado automaticamente.</p>
          <div className="bg-card border border-border rounded-lg p-6 inline-flex flex-col items-center gap-4">
            <img src={qrImg} alt="QR Code PIX" width={280} height={280} className="rounded bg-white p-2" />
            <div className="text-2xl font-black text-primary" style={{ fontFamily: "Playfair Display, serif" }}>
              {formatBRL(pixResult.amount / 100)}
            </div>
            <div className="w-full">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-left mb-1">PIX Copia e Cola</div>
              <div className="flex gap-2">
                <input readOnly value={pixResult.qrcode} className="flex-1 border border-border rounded px-2 py-2 text-xs bg-background truncate" />
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(pixResult.qrcode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-3 py-2 rounded text-xs font-bold"
                >
                  <Copy className="size-3.5" /> {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-6">Pedido: <span className="font-mono">{pixResult.id}</span></p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">Voltar para a loja</Link>
        </div>
      </StoreLayout>
    );
  }

  if (cardResult) {
    const approved = cardResult.status === "APPROVED";
    const pending = cardResult.status === "PENDING" || cardResult.status === "PENDING_3DS";
    return (
      <StoreLayout>
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <div className={`size-20 rounded-full grid place-items-center mx-auto mb-6 ${approved ? "bg-accent/10" : pending ? "bg-secondary" : "bg-destructive/10"}`}>
            {approved
              ? <Check className="size-10 text-accent" />
              : pending
                ? <Loader2 className="size-10 text-muted-foreground animate-spin" />
                : <AlertCircle className="size-10 text-destructive" />}
          </div>
          <h1 className="text-3xl font-black mb-3" style={{ fontFamily: "Playfair Display, serif" }}>
            {approved ? "Pagamento aprovado!" : pending ? "Aguardando confirmação" : "Pagamento recusado"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {approved
              ? "Obrigado pela compra. Você receberá a nota fiscal e o rastreio por e-mail."
              : pending
                ? "Sua transação está em análise. Assim que confirmada, avisaremos por e-mail."
                : "Não foi possível processar seu cartão. Tente novamente com outro método."}
          </p>
          <p className="text-xs text-muted-foreground mb-6">Pedido: <span className="font-mono">{cardResult.id}</span></p>
          <Link to="/" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-bold">
            {approved ? "Voltar para a loja" : "Tentar novamente"}
          </Link>
        </div>
      </StoreLayout>
    );
  }

  if (count === 0) {
    return (
      <StoreLayout>
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-black mb-3" style={{ fontFamily: "Playfair Display, serif" }}>Nada para finalizar</h1>
          <p className="text-muted-foreground mb-6">Seu carrinho está vazio.</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-bold">Ver produtos</Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-black mb-8" style={{ fontFamily: "Playfair Display, serif" }}>Finalizar compra</h1>

        <form onSubmit={handleSubmit} noValidate className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Section title="1. Contato">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="E-mail" type="email" value={form.email} onChange={(v) => update("email", v)} error={errors.email} placeholder="voce@email.com" autoComplete="email" />
                <Field label="Telefone" value={form.phone} onChange={(v) => update("phone", maskPhone(v))} error={errors.phone} placeholder="(31) 99999-9999" inputMode="tel" autoComplete="tel" />
              </div>
            </Section>

            <Section title="2. Entrega">
              <div className="grid md:grid-cols-6 gap-4">
                <Field className="md:col-span-4" label="Nome completo" value={form.name} onChange={(v) => update("name", v)} error={errors.name} autoComplete="name" />
                <Field className="md:col-span-2" label="CPF" value={form.cpf} onChange={(v) => update("cpf", maskCPF(v))} error={errors.cpf} placeholder="000.000.000-00" inputMode="numeric" />

                <div className="md:col-span-2 relative">
                  <Field label="CEP" value={form.cep} onChange={(v) => update("cep", maskCEP(v))} onBlur={handleCepBlur} error={errors.cep ?? cepError ?? undefined} placeholder="00000-000" inputMode="numeric" autoComplete="postal-code" />
                  {cepLoading && <Loader2 className="size-4 animate-spin absolute right-3 top-9 text-muted-foreground" />}
                </div>
                <Field className="md:col-span-3" label="Cidade" value={form.city} onChange={(v) => update("city", v)} error={errors.city} autoComplete="address-level2" />
                <Field className="md:col-span-1" label="UF" value={form.uf} onChange={(v) => update("uf", v.toUpperCase().slice(0, 2))} maxLength={2} autoComplete="address-level1" />

                <Field className="md:col-span-4" label="Endereço" value={form.address} onChange={(v) => update("address", v)} error={errors.address} autoComplete="address-line1" />
                <Field className="md:col-span-2" label="Número" value={form.number} onChange={(v) => update("number", v)} error={errors.number} inputMode="numeric" />

                <Field className="md:col-span-3" label="Bairro" value={form.neighborhood} onChange={(v) => update("neighborhood", v)} autoComplete="address-level3" />
                <Field className="md:col-span-3" label="Complemento" value={form.complement} onChange={(v) => update("complement", v)} placeholder="Apto, bloco, ref." />
              </div>
            </Section>

            {selaItems.length > 0 && (
              <Section title="3. Personalização da sela">
                <p className="mb-4 text-sm text-muted-foreground">
                  Gravação no couro — <strong className="text-foreground">grátis</strong>. Deixe em branco para não personalizar.
                </p>
                <div className="space-y-3">
                  {selaItems.map((i) => (
                    <label key={i.slug} className="block">
                      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground truncate">{i.name}</div>
                      <input
                        type="text"
                        maxLength={24}
                        value={engravings[i.slug] ?? ""}
                        onChange={(e) => setEngravings((p) => ({ ...p, [i.slug]: e.target.value }))}
                        placeholder="Nome ou inscrição (máx. 24)"
                        className="mt-1 w-full border-b border-border bg-transparent py-1 text-sm outline-none focus:border-accent"
                      />
                    </label>
                  ))}
                </div>
              </Section>

            )}

            <Section title={selaItems.length > 0 ? "4. Pagamento" : "3. Pagamento"}>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <PayOption current={method} value="pix" onSelect={setMethod} icon={QrCode} label="PIX" hint="10% off" />
                <PayOption current={method} value="card" onSelect={setMethod} icon={CreditCard} label="Cartão" hint="até 12x" />
              </div>

              {method === "card" && (
                <div className="grid md:grid-cols-2 gap-4">
                  <Field className="md:col-span-2" label="Número do cartão" value={form.cardNumber} onChange={(v) => update("cardNumber", maskCard(v))} error={errors.cardNumber} placeholder="0000 0000 0000 0000" inputMode="numeric" autoComplete="cc-number" />
                  <Field className="md:col-span-2" label="Nome impresso" value={form.cardName} onChange={(v) => update("cardName", v.toUpperCase())} error={errors.cardName} autoComplete="cc-name" />
                  <Field label="Validade (MM/AA)" value={form.cardExp} onChange={(v) => update("cardExp", maskCardExp(v))} error={errors.cardExp} placeholder="MM/AA" inputMode="numeric" autoComplete="cc-exp" />
                  <Field label="CVV" value={form.cardCvv} onChange={(v) => update("cardCvv", maskCVV(v))} error={errors.cardCvv} placeholder="123" inputMode="numeric" autoComplete="cc-csc" />
                  <label className="md:col-span-2 block">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Parcelas</span>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(Number(e.target.value))}
                      className="mt-1 w-full border border-border rounded-md px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-accent"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}x de {formatBRL(total / n)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
              {method === "pix" && (
                <div className="bg-secondary/50 rounded-md p-4 text-sm text-muted-foreground">
                  Ao confirmar, geraremos o QR Code PIX. Você tem 30 minutos para pagar.
                </div>
              )}

              {gatewayError && (
                <div className="mt-4 flex items-start gap-2 bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                  <AlertCircle className="size-4 mt-0.5 shrink-0" />
                  <span>{gatewayError}</span>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="size-3.5 text-accent" /> Pagamento processado com criptografia via Legacy Ecom. Seus dados nunca ficam em nossos servidores.
              </div>
            </Section>
          </div>

          <aside className="bg-card border border-border rounded-lg p-6 h-fit sticky top-32">
            <h2 className="font-black text-xl mb-5" style={{ fontFamily: "Playfair Display, serif" }}>Seu pedido</h2>
            <ul className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {items.map((i) => (
                <li key={i.slug} className="flex gap-3 text-sm">
                  <img src={i.image} alt="" className="size-12 rounded object-cover bg-secondary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="line-clamp-2 font-medium">{i.name}</div>
                    <div className="text-xs text-muted-foreground">{i.qty} × {formatBRL(i.price)}</div>
                  </div>
                  <div className="font-bold text-primary shrink-0">{formatBRL(i.qty * i.price)}</div>
                </li>
              ))}
            </ul>
            <div className="space-y-2 text-sm border-t border-border pt-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatBRL(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>{frete === 0 ? <span className="text-accent font-bold">Grátis</span> : formatBRL(frete)}</span></div>
              {engravingCount > 0 && (
                <div className="flex justify-between"><span className="text-muted-foreground">Personalização ({engravingCount}×)</span><span className="text-accent font-bold">Grátis</span></div>
              )}

              {method === "pix" && (
                <div className="flex justify-between text-accent font-bold"><span>Desconto PIX (10%)</span><span>-{formatBRL(baseTotal * 0.1)}</span></div>
              )}
            </div>
            <div className="border-t border-border pt-3 mt-3 flex justify-between items-baseline">
              <span className="font-bold">Total</span>
              <span className="text-2xl font-black text-primary" style={{ fontFamily: "Playfair Display, serif" }}>{formatBRL(total)}</span>
            </div>
            <button
              type="submit"
              disabled={processing}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-6 py-4 rounded-md font-black uppercase tracking-wider text-sm hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {processing
                ? <><Loader2 className="size-4 animate-spin" /> Processando…</>
                : <><Lock className="size-4" /> Confirmar pedido</>}
            </button>
          </aside>
        </form>
      </div>
    </StoreLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-lg p-6">
      <h2 className="font-black text-lg mb-4" style={{ fontFamily: "Playfair Display, serif" }}>{title}</h2>
      {children}
    </section>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "onBlur" | "className">;

function Field({ label, value, onChange, onBlur, error, className = "", ...rest }: FieldProps) {
  return (
    <label className={`block ${className}`} data-error={error ? "true" : undefined}>
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`mt-1 w-full border rounded-md px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 transition ${
          error ? "border-destructive focus:ring-destructive/40" : "border-border focus:ring-accent"
        }`}
      />
      {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
    </label>
  );
}

function PayOption({
  current, value, onSelect, icon: Icon, label, hint,
}: {
  current: PayMethod;
  value: PayMethod;
  onSelect: (v: PayMethod) => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`flex flex-col items-center gap-1 p-4 rounded-md border-2 transition ${
        active ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
      }`}
    >
      <Icon className={`size-6 ${active ? "text-accent" : "text-muted-foreground"}`} />
      <span className="font-bold text-sm">{label}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{hint}</span>
    </button>
  );
}
