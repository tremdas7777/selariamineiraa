import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, ShieldCheck, Truck, CreditCard, Star, Minus, Plus, ShoppingBag, Check } from "lucide-react";
import { StoreLayout } from "@/components/StoreLayout";
import { getProduct, products, formatBRL } from "@/lib/products";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/produto/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} — Selaria Mineira` },
          { name: "description", content: `${loaderData.product.name} por ${formatBRL(loaderData.product.priceNumber)}. Couro legítimo, feito à mão em Minas Gerais.` },
          { property: "og:title", content: loaderData.product.name },
          { property: "og:description", content: `${loaderData.product.name} — Selaria Mineira` },
          { property: "og:image", content: loaderData.product.image },
        ]
      : [{ title: "Produto — Selaria Mineira" }],
  }),
  component: ProductPage,
  notFoundComponent: () => (
    <StoreLayout>
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-black mb-4" style={{ fontFamily: "Playfair Display, serif" }}>Produto não encontrado</h1>
        <p className="text-muted-foreground mb-6">O item que você procura não está mais disponível.</p>
        <Link to="/" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-bold">Voltar à loja</Link>
      </div>
    </StoreLayout>
  ),
  errorComponent: ({ reset }) => {
    const router = useRouter();
    return (
      <StoreLayout>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Erro ao carregar o produto</h1>
          <button onClick={() => { router.invalidate(); reset(); }} className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-bold">Tentar novamente</button>
        </div>
      </StoreLayout>
    );
  },
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { add } = useCart();

  const parcela = product.priceNumber / 10;
  const pixPrice = product.priceNumber * 0.95;
  const related = products.filter((p) => p.slug !== product.slug).slice(0, 4);

  const handleAdd = () => {
    add({ slug: product.slug, name: product.name, image: product.image, price: product.priceNumber }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <StoreLayout>
      {/* Breadcrumb */}
      <div className="bg-secondary/50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
          <Link to="/" className="hover:text-accent">Início</Link>
          <ChevronRight className="size-3" />
          <a href="/#produtos" className="hover:text-accent">Produtos</a>
          <ChevronRight className="size-3" />
          <span className="text-foreground font-medium line-clamp-1">{product.name}</span>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <img src={product.image} alt={product.name} width={800} height={800} className="w-full aspect-square object-cover" />
        </div>

        {/* Info */}
        <div>
          <div className="flex gap-0.5 mb-3 text-accent">
            {[...Array(5)].map((_, i) => <Star key={i} className="size-4 fill-current" />)}
            <span className="text-xs text-muted-foreground ml-2">(37 avaliações)</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight" style={{ fontFamily: "Playfair Display, serif" }}>
            {product.name}
          </h1>

          <div className="mb-6">
            {product.oldPrice && (
              <div className="text-sm text-muted-foreground line-through">De R$ {product.oldPrice}</div>
            )}
            <div className="text-4xl font-black text-primary" style={{ fontFamily: "Playfair Display, serif" }}>
              {formatBRL(product.priceNumber)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              ou <strong>10x de {formatBRL(parcela)}</strong> sem juros
            </div>
            <div className="inline-block mt-2 bg-accent/10 text-accent-foreground px-3 py-1 rounded text-xs font-bold">
              <span className="text-accent">{formatBRL(pixPrice)}</span> à vista no PIX (5% off)
            </div>
          </div>

          <p className="text-muted-foreground leading-relaxed mb-6">
            Peça em couro bovino legítimo, curtimento vegetal e acabamento manual em nossa oficina no coração das Vertentes de Minas Gerais. Costura dupla reforçada e ferragens em inox garantem durabilidade para atravessar gerações.
          </p>

          {/* Qty + CTA */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center border border-border rounded-md">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3 hover:bg-secondary transition" aria-label="Diminuir">
                <Minus className="size-4" />
              </button>
              <span className="w-10 text-center font-bold">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="p-3 hover:bg-secondary transition" aria-label="Aumentar">
                <Plus className="size-4" />
              </button>
            </div>
            <button
              onClick={handleAdd}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-4 rounded-md font-bold uppercase tracking-wider text-sm hover:bg-accent hover:text-accent-foreground transition"
            >
              {added ? <><Check className="size-5" /> Adicionado!</> : <><ShoppingBag className="size-5" /> Adicionar ao carrinho</>}
            </button>
          </div>

          <Link to="/checkout" className="block w-full text-center bg-foreground text-background py-4 rounded-md font-black uppercase tracking-wider text-sm border-2 border-accent hover:bg-primary hover:border-primary transition mb-6">
            Comprar agora
          </Link>

          {/* CEP */}
          <div className="border border-border rounded-md p-4 mb-6">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Calcular frete</label>
            <div className="flex gap-2 mt-2">
              <input type="text" placeholder="00000-000" className="flex-1 border border-border rounded-md px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-accent" />
              <button className="bg-foreground text-background px-4 py-2 rounded-md text-sm font-bold hover:bg-primary transition">OK</button>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            {[
              { icon: ShieldCheck, t: "Compra segura" },
              { icon: Truck, t: "Enviamos p/ todo Brasil" },
              { icon: CreditCard, t: "Até 10x sem juros" },
            ].map((b) => (
              <div key={b.t} className="flex flex-col items-center text-center gap-1 p-3 bg-secondary/50 rounded-md">
                <b.icon className="size-5 text-accent" />
                <span className="font-medium">{b.t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="max-w-7xl mx-auto px-4 py-10 border-t border-border">
        <h2 className="text-2xl font-black mb-6" style={{ fontFamily: "Playfair Display, serif" }}>Descrição do produto</h2>
        <div className="prose max-w-3xl text-muted-foreground space-y-3">
          <p>Confeccionado 100% em couro bovino selecionado, este produto reúne o melhor da tradição artesanal mineira com o rigor técnico exigido pelos cavaleiros mais experientes.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Material: couro bovino legítimo</li>
            <li>Costura: dupla reforçada com linha encerada</li>
            <li>Ferragens: aço inox e alpaca</li>
            <li>Origem: Vertentes / Minas Gerais</li>
            <li>Garantia: 12 meses contra defeitos de fabricação</li>
          </ul>
        </div>
      </section>

      {/* Related */}
      <section className="bg-secondary/50 border-t border-border py-14">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-black mb-8" style={{ fontFamily: "Playfair Display, serif" }}>Você também vai gostar</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {related.map((p) => (
              <Link
                key={p.slug}
                to="/produto/$slug"
                params={{ slug: p.slug }}
                className="group bg-card rounded-lg overflow-hidden border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="aspect-square bg-secondary overflow-hidden">
                  <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2 min-h-[2.5rem]">{p.name}</h3>
                  <div className="text-lg font-black text-primary" style={{ fontFamily: "Playfair Display, serif" }}>{formatBRL(p.priceNumber)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}
