import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { CreditCard, QrCode, Barcode, Lock, Check, Sparkles } from "lucide-react";
import { StoreLayout } from "@/components/StoreLayout";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/products";

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

type PayMethod = "pix" | "card" | "boleto";

const ENGRAVING_PRICE = 49.9;
const isSela = (name: string) => /\bsela\b/i.test(name);

function CheckoutPage() {
  const { items, subtotal, count, clear } = useCart();
  const navigate = useNavigate();
  const [method, setMethod] = useState<PayMethod>("pix");
  const [done, setDone] = useState(false);
  const [engravings, setEngravings] = useState<Record<string, string>>({});

  const selaItems = useMemo(() => items.filter((i) => isSela(i.name)), [items]);
  const engravingCount = selaItems.reduce(
    (sum, i) => sum + (engravings[i.slug]?.trim() ? i.qty : 0),
    0,
  );
  const engravingTotal = engravingCount * ENGRAVING_PRICE;

  const frete = subtotal > 0 && subtotal < 399 ? 29.9 : 0;
  const baseTotal = subtotal + frete + engravingTotal;
  const total = method === "pix" ? baseTotal * 0.95 : baseTotal;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: integrar gateway de pagamento (Stripe / Mercado Pago / Pagar.me)
    setDone(true);
    clear();
    setTimeout(() => navigate({ to: "/" }), 4000);
  };

  if (done) {
    return (
      <StoreLayout>
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <div className="size-20 rounded-full bg-accent/10 grid place-items-center mx-auto mb-6">
            <Check className="size-10 text-accent" />
          </div>
          <h1 className="text-3xl font-black mb-3" style={{ fontFamily: "Playfair Display, serif" }}>Pedido recebido!</h1>
          <p className="text-muted-foreground mb-6">
            Obrigado pela compra. Assim que o gateway de pagamento estiver conectado, você receberá as instruções por e-mail.
          </p>
          <Link to="/" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-bold">Voltar para a loja</Link>
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

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Section title="1. Contato">
              <Field label="E-mail" name="email" type="email" required />
              <Field label="Telefone" name="phone" required />
            </Section>

            <Section title="2. Entrega">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Nome completo" name="name" required />
                <Field label="CPF" name="cpf" required />
                <Field label="CEP" name="cep" required />
                <Field label="Cidade" name="city" required />
                <Field label="Endereço" name="address" required className="md:col-span-2" />
                <Field label="Número" name="number" required />
                <Field label="Complemento" name="complement" />
              </div>
            </Section>

            {selaItems.length > 0 && (
              <Section title="3. Personalização da sela">
                <div className="flex items-start gap-3 mb-4 text-sm text-muted-foreground">
                  <Sparkles className="size-5 text-accent shrink-0 mt-0.5" />
                  <p>
                    Grave o nome do cavaleiro, do haras ou uma inscrição no couro da sua sela.
                    Feito à mão por nossos mestres seleiros. <strong className="text-foreground">+{formatBRL(ENGRAVING_PRICE)}</strong> por sela personalizada
                    (deixe em branco para não personalizar).
                  </p>
                </div>
                <div className="space-y-3">
                  {selaItems.map((i) => (
                    <label key={i.slug} className="flex items-center gap-3 p-3 border border-border rounded-md">
                      <img src={i.image} alt="" className="size-12 rounded object-cover bg-secondary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground truncate">{i.name}</div>
                        <input
                          type="text"
                          maxLength={24}
                          value={engravings[i.slug] ?? ""}
                          onChange={(e) => setEngravings((p) => ({ ...p, [i.slug]: e.target.value }))}
                          placeholder="Ex.: João Silva — Haras Boa Vista"
                          className="mt-1 w-full border-b border-border bg-transparent py-1 text-sm outline-none focus:border-accent"
                        />
                        <div className="text-[10px] text-muted-foreground mt-0.5">Máx. 24 caracteres · letras maiúsculas em relevo</div>
                      </div>
                    </label>
                  ))}
                </div>
              </Section>
            )}

            <Section title={selaItems.length > 0 ? "4. Pagamento" : "3. Pagamento"}>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <PayOption current={method} value="pix" onSelect={setMethod} icon={QrCode} label="PIX" hint="5% off" />
                <PayOption current={method} value="card" onSelect={setMethod} icon={CreditCard} label="Cartão" hint="até 10x" />
                <PayOption current={method} value="boleto" onSelect={setMethod} icon={Barcode} label="Boleto" hint="à vista" />
              </div>

              {method === "card" && (
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Número do cartão" name="cardNumber" required className="md:col-span-2" />
                  <Field label="Nome impresso" name="cardName" required className="md:col-span-2" />
                  <Field label="Validade (MM/AA)" name="cardExp" required />
                  <Field label="CVV" name="cardCvv" required />
                </div>
              )}
              {method === "pix" && (
                <div className="bg-secondary/50 rounded-md p-4 text-sm text-muted-foreground">
                  Ao confirmar, geraremos o QR Code PIX. Você tem 30 minutos para pagar.
                </div>
              )}
              {method === "boleto" && (
                <div className="bg-secondary/50 rounded-md p-4 text-sm text-muted-foreground">
                  O boleto será enviado por e-mail. Prazo de vencimento: 3 dias úteis.
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="size-3.5 text-accent" /> Ambiente 100% seguro. Gateway de pagamento será integrado em breve.
              </div>
            </Section>
          </div>

          {/* Summary */}
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
              {engravingTotal > 0 && (
                <div className="flex justify-between"><span className="text-muted-foreground">Personalização ({engravingCount}×)</span><span>{formatBRL(engravingTotal)}</span></div>
              )}
              {method === "pix" && (
                <div className="flex justify-between text-accent font-bold"><span>Desconto PIX (5%)</span><span>-{formatBRL(baseTotal * 0.05)}</span></div>
              )}
            </div>
            <div className="border-t border-border pt-3 mt-3 flex justify-between items-baseline">
              <span className="font-bold">Total</span>
              <span className="text-2xl font-black text-primary" style={{ fontFamily: "Playfair Display, serif" }}>{formatBRL(total)}</span>
            </div>
            <button type="submit" className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-6 py-4 rounded-md font-black uppercase tracking-wider text-sm hover:brightness-110 transition">
              <Lock className="size-4" /> Confirmar pedido
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

function Field({ label, name, type = "text", required, className = "" }: { label: string; name: string; type?: string; required?: boolean; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}{required && " *"}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-1 w-full border border-border rounded-md px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-accent"
      />
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
