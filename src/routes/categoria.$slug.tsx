import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronRight, Star } from "lucide-react";
import { StoreLayout } from "@/components/StoreLayout";
import { getCategory, getProductsByCategory, categories, formatBRL, type CategorySlug, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/categoria/$slug")({
  loader: ({ params }) => {
    const category = getCategory(params.slug);
    if (!category) throw notFound();
    const items = getProductsByCategory(category.slug);
    return { category, items };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.category.name} — Selaria Mineira` },
          { name: "description", content: loaderData.category.description },
          { property: "og:title", content: `${loaderData.category.name} — Selaria Mineira` },
          { property: "og:description", content: loaderData.category.description },
        ]
      : [{ title: "Categoria — Selaria Mineira" }, { name: "robots", content: "noindex" }],
  }),
  component: CategoryPage,
  notFoundComponent: () => (
    <StoreLayout>
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-black mb-4" style={{ fontFamily: "Playfair Display, serif" }}>Categoria não encontrada</h1>
        <Link to="/categorias" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-bold">Ver todas as categorias</Link>
      </div>
    </StoreLayout>
  ),
  errorComponent: () => (
    <StoreLayout>
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Erro ao carregar categoria</h1>
      </div>
    </StoreLayout>
  ),
});

function CategoryPage() {
  const { category, items } = Route.useLoaderData();
  const { add } = useCart();
  const others = categories.filter((c) => c.slug !== category.slug);

  return (
    <StoreLayout>
      <div className="bg-secondary/50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
          <Link to="/" className="hover:text-accent">Início</Link>
          <ChevronRight className="size-3" />
          <Link to="/categorias" className="hover:text-accent">Categorias</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground font-medium">{category.name}</span>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-8">
          <span className="text-accent text-xs font-bold uppercase tracking-[0.25em]">Coleção</span>
          <h1 className="text-3xl md:text-5xl font-black mt-2" style={{ fontFamily: "Playfair Display, serif" }}>{category.name}</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl">{category.description}</p>
          <p className="text-xs text-muted-foreground mt-2">{items.length} {items.length === 1 ? "produto" : "produtos"}</p>
        </div>

        {items.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <p className="text-muted-foreground mb-4">Ainda não temos produtos publicados nesta coleção.</p>
            <Link to="/" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-bold text-sm">Ver destaques</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {items.map((p: Product) => {
              const parcela = p.priceNumber / 10;
              return (
                <div key={p.slug} className="group bg-card rounded-lg overflow-hidden border border-border hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  <Link to="/produto/$slug" params={{ slug: p.slug }} className="relative aspect-square bg-secondary overflow-hidden block">
                    {p.oldPrice && (
                      <span className="absolute top-3 left-3 z-10 bg-accent text-accent-foreground text-[10px] font-bold uppercase px-2 py-1 rounded-sm tracking-wider">Oferta</span>
                    )}
                    <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </Link>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex gap-0.5 mb-2 text-accent">
                      {[...Array(5)].map((_, i) => <Star key={i} className="size-3 fill-current" />)}
                    </div>
                    <Link to="/produto/$slug" params={{ slug: p.slug }} className="font-semibold text-sm mb-3 line-clamp-2 min-h-[2.5rem] hover:text-accent">{p.name}</Link>
                    <div className="mb-3">
                      {p.oldPrice && <div className="text-xs text-muted-foreground line-through">R$ {p.oldPrice}</div>}
                      <div className="text-xl font-black text-primary" style={{ fontFamily: "Playfair Display, serif" }}>{formatBRL(p.priceNumber)}</div>
                      <div className="text-xs text-muted-foreground">ou 10x de {formatBRL(parcela)} sem juros</div>
                    </div>
                    <div className="mt-auto grid grid-cols-2 gap-2">
                      <Link to="/produto/$slug" params={{ slug: p.slug }} className="text-center bg-secondary text-foreground text-xs font-bold uppercase tracking-wider py-2.5 rounded hover:bg-foreground hover:text-background transition">Detalhes</Link>
                      <button onClick={() => add({ slug: p.slug, name: p.name, image: p.image, price: p.priceNumber })} className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider py-2.5 rounded hover:bg-accent transition">Comprar</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-secondary/50 border-t border-border py-14">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-black mb-6" style={{ fontFamily: "Playfair Display, serif" }}>Outras coleções</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {others.map((c) => (
              <Link key={c.slug} to="/categoria/$slug" params={{ slug: c.slug as CategorySlug }} className="bg-card border border-border rounded-md p-4 text-center hover:border-accent hover:text-accent transition font-bold text-sm">
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}
