import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { StoreLayout } from "@/components/StoreLayout";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/products";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Meu Carrinho — Selaria Mineira" },
      { name: "description", content: "Revise os itens do seu carrinho e finalize sua compra na Selaria Mineira." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotal, count } = useCart();
  const frete = subtotal > 0 && subtotal < 399 ? 29.9 : 0;
  const total = subtotal + frete;

  if (count === 0) {
    return (
      <StoreLayout>
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <ShoppingBag className="size-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-3xl font-black mb-3" style={{ fontFamily: "Playfair Display, serif" }}>Seu carrinho está vazio</h1>
          <p className="text-muted-foreground mb-8">Explore nossos produtos e comece a montar sua comitiva.</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-md font-bold uppercase tracking-wider text-sm hover:bg-accent hover:text-accent-foreground transition">
            Voltar para a loja
          </Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-black mb-8" style={{ fontFamily: "Playfair Display, serif" }}>Meu Carrinho</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.slug} className="flex gap-4 bg-card border border-border rounded-lg p-4">
                <Link to="/produto/$slug" params={{ slug: item.slug }} className="shrink-0">
                  <img src={item.image} alt={item.name} className="size-24 md:size-28 rounded-md object-cover bg-secondary" />
                </Link>
                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1">
                    <Link to="/produto/$slug" params={{ slug: item.slug }} className="font-semibold hover:text-accent line-clamp-2">
                      {item.name}
                    </Link>
                    <div className="text-sm text-muted-foreground mt-1">{formatBRL(item.price)} un.</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-border rounded-md">
                      <button onClick={() => setQty(item.slug, item.qty - 1)} className="p-2 hover:bg-secondary" aria-label="Diminuir"><Minus className="size-3" /></button>
                      <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                      <button onClick={() => setQty(item.slug, item.qty + 1)} className="p-2 hover:bg-secondary" aria-label="Aumentar"><Plus className="size-3" /></button>
                    </div>
                    <div className="font-black text-primary w-24 text-right" style={{ fontFamily: "Playfair Display, serif" }}>
                      {formatBRL(item.price * item.qty)}
                    </div>
                    <button onClick={() => remove(item.slug)} className="p-2 text-muted-foreground hover:text-destructive transition" aria-label="Remover">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-accent transition">
              ← Continuar comprando
            </Link>
          </div>

          {/* Summary */}
          <aside className="bg-card border border-border rounded-lg p-6 h-fit sticky top-32">
            <h2 className="font-black text-xl mb-5" style={{ fontFamily: "Playfair Display, serif" }}>Resumo do pedido</h2>
            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal ({count} {count === 1 ? "item" : "itens"})</span><span className="font-medium">{formatBRL(subtotal)}</span></div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span className="font-medium">{frete === 0 ? <span className="text-accent font-bold">Grátis</span> : formatBRL(frete)}</span>
              </div>
              {frete > 0 && (
                <div className="text-xs text-muted-foreground bg-secondary/50 rounded p-2">
                  Faltam {formatBRL(399 - subtotal)} para ganhar frete grátis!
                </div>
              )}
            </div>
            <div className="border-t border-border pt-4 mb-2 flex justify-between items-baseline">
              <span className="font-bold">Total</span>
              <span className="text-2xl font-black text-primary" style={{ fontFamily: "Playfair Display, serif" }}>{formatBRL(total)}</span>
            </div>
            <div className="text-xs text-muted-foreground mb-5">
              ou <strong>12x de {formatBRL(total / 12)}</strong>
            </div>
            <Link to="/checkout" className="w-full inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-6 py-4 rounded-md font-black uppercase tracking-wider text-sm hover:brightness-110 transition">
              Finalizar compra <ArrowRight className="size-4" />
            </Link>
          </aside>
        </div>
      </div>
    </StoreLayout>
  );
}
