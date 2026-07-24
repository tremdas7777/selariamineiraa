import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { StoreLayout } from "@/components/StoreLayout";
import { categories, getProductsByCategory } from "@/lib/products";

export const Route = createFileRoute("/categorias")({
  head: () => ({
    meta: [
      { title: "Todas as Categorias — Selaria Mineira" },
      { name: "description", content: "Explore todas as coleções da Selaria Mineira: selas, arreios, cabrestos, esporas, mantas e acessórios." },
      { property: "og:title", content: "Todas as Categorias — Selaria Mineira" },
      { property: "og:description", content: "Explore todas as coleções da Selaria Mineira." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  return (
    <StoreLayout>
      <div className="bg-secondary/50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
          <Link to="/" className="hover:text-accent">Início</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground font-medium">Categorias</span>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <span className="text-accent text-xs font-bold uppercase tracking-[0.25em]">Explore</span>
          <h1 className="text-3xl md:text-5xl font-black mt-2" style={{ fontFamily: "Playfair Display, serif" }}>Todas as coleções</h1>
          <p className="text-muted-foreground mt-3">Escolha a coleção que combina com o seu trecho.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((c) => {
            const cover = getProductsByCategory(c.slug)[0]?.image;
            return (
              <Link
                key={c.slug}
                to="/categoria/$slug"
                params={{ slug: c.slug }}
                className="group relative block rounded-lg overflow-hidden border border-border bg-card hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                {cover && (
                  <div className="aspect-[4/3] overflow-hidden bg-secondary">
                    <img src={cover} alt={c.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <div className="p-5">
                  <div className="mb-1">
                    <h2 className="text-xl font-black text-primary" style={{ fontFamily: "Playfair Display, serif" }}>{c.name}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{c.description}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-accent uppercase tracking-widest">
                    Ver coleção <ChevronRight className="size-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </StoreLayout>
  );
}
