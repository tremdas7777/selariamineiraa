import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Truck, CreditCard, Tag, Phone, Star, ChevronRight, ShoppingBag } from "lucide-react";
import heroSaddle from "@/assets/hero-saddle.jpg";
import { StoreLayout } from "@/components/StoreLayout";
import { products, formatBRL, categories, getProductsByCategory, selaTipos, getSelasByTipo, type SelaTipo, type CategorySlug } from "@/lib/products";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/")({
  component: Home,
});

const categoriasHome: { slug: CategorySlug; nome: string; img: string; count: number }[] = categories
  .map((c) => {
    const list = getProductsByCategory(c.slug);
    return { slug: c.slug, nome: c.name, img: list[0]?.image ?? "", count: list.length };
  })
  .filter((c) => c.count > 0 && c.img);

const destaques = products.slice(0, 8);

const tiposSela = selaTipos
  .map((t) => {
    const list = getSelasByTipo(t.slug);
    return { ...t, img: list[0]?.image, count: list.length };
  })
  .filter((t) => t.count > 0);

const beneficios = [
  { icon: ShieldCheck, titulo: "Loja 100% segura", sub: "selo de segurança" },
  { icon: Truck, titulo: "Entregamos", sub: "em todo o Brasil" },
  { icon: CreditCard, titulo: "Parcele suas compras", sub: "em até 12x" },
  { icon: Tag, titulo: "10% de desconto", sub: "no PIX" },
];

function Home() {
  const { add } = useCart();
  return (
    <StoreLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img src={heroSaddle} alt="Sela artesanal em couro ao pôr do sol de Minas Gerais" width={1920} height={900} className="w-full h-[380px] md:h-[520px] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/40 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 md:px-8 w-full">
            <div className="max-w-xl text-background">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-accent text-accent-foreground text-[11px] font-black uppercase tracking-widest rounded-sm mb-5 animate-pulse">
                <Tag className="size-3" /> Promoção Especial • 50% OFF
              </span>
              <h1 className="text-4xl md:text-6xl leading-[1.05] font-black mb-5" style={{ fontFamily: "Playfair Display, serif" }}>
                Selas de <span className="text-accent italic">respeito</span>,<br />couro de verdade.
              </h1>
              <p className="text-base md:text-lg opacity-90 mb-4 max-w-md">
                Arreios, selas e artigos em couro legítimo — feitos à mão nas Vertentes de Minas Gerais para quem entende do trecho.
              </p>
              <div className="mb-8" />
              <div className="flex flex-wrap gap-3">
                <a href="#produtos" className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-md font-bold hover:brightness-110 transition">
                  Confira aqui <ChevronRight className="size-4" />
                </a>
                <a href="#categorias" className="inline-flex items-center gap-2 border border-background/60 text-background px-6 py-3 rounded-md font-bold hover:bg-background hover:text-foreground transition">
                  Ver categorias
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {beneficios.map((b) => (
            <div key={b.titulo} className="flex items-center gap-3">
              <div className="size-11 rounded-full bg-accent/10 grid place-items-center shrink-0">
                <b.icon className="size-5 text-accent" />
              </div>
              <div>
                <div className="font-bold text-sm text-foreground leading-tight">{b.titulo}</div>
                <div className="text-xs text-muted-foreground">{b.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categorias Gerais */}
      <section id="categorias" className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-accent text-xs font-bold uppercase tracking-[0.25em]">Compre por Categoria</span>
            <h2 className="text-3xl md:text-4xl font-black mt-2" style={{ fontFamily: "Playfair Display, serif" }}>O essencial do cavaleiro</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {categoriasHome.map((c) => (
              <Link key={c.slug} to="/categoria/$slug" params={{ slug: c.slug }} className="group relative block rounded-lg overflow-hidden border-2 border-foreground/80 shadow-xl bg-foreground aspect-[4/5] md:aspect-[4/3]">
                <img src={c.img} alt={c.nome} width={800} height={800} loading="lazy" className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/50 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-between p-4 md:p-6 text-background">
                  <div className="text-center">
                    <h3 className="text-xl md:text-3xl font-black uppercase text-accent drop-shadow-lg tracking-wider leading-none" style={{ fontFamily: "Playfair Display, serif" }}>{c.nome}</h3>
                    <span className="text-[10px] md:text-xs font-bold text-background/80 uppercase tracking-widest">{c.count} produtos</span>
                  </div>
                  <span className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-bold text-xs md:text-sm px-4 py-2 rounded-full shadow-lg group-hover:brightness-110 transition">
                    Confira aqui <ChevronRight className="size-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Nossas Selas - estilo barril */}
      <section className="py-16 md:py-20 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_20%_30%,white_1px,transparent_1px),radial-gradient(circle_at_70%_60%,white_1px,transparent_1px)] bg-[length:40px_40px]" />
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="text-center mb-12">
            <span className="text-accent text-xs font-bold uppercase tracking-[0.25em]">Carro-chefe da casa</span>
            <h2 className="text-3xl md:text-5xl font-black mt-2" style={{ fontFamily: "Playfair Display, serif" }}>
              Nossas <span className="text-accent italic">Selas</span>
            </h2>
            <p className="text-primary-foreground/70 mt-3 max-w-xl mx-auto">Escolha o tipo de sela ideal para sua lida — mangalarga, australiana, laço e mais.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
            {tiposSela.map((t) => (
              <Link
                key={t.slug}
                to="/selas/$tipo"
                params={{ tipo: t.slug as SelaTipo }}
                className="group relative block rounded-lg overflow-hidden border-2 border-accent/30 shadow-2xl bg-gradient-to-b from-[#3d2817] to-[#1a0f08] aspect-[4/5]"
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.7)_100%)]" />
                {t.img && (
                  <img
                    src={t.img}
                    alt={`Sela ${t.name}`}
                    loading="lazy"
                    className="absolute inset-0 m-auto w-[80%] h-[55%] object-contain top-8 group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl"
                  />
                )}
                <div className="absolute inset-x-0 top-5 text-center px-3">
                  <h3 className="text-2xl md:text-3xl font-black uppercase text-accent drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] tracking-wide leading-none" style={{ fontFamily: "Playfair Display, serif" }}>
                    {t.name}
                  </h3>
                </div>
                <div className="absolute inset-x-0 bottom-5 flex justify-center">
                  <span className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-bold text-xs md:text-sm px-5 py-2.5 rounded-full shadow-xl group-hover:brightness-110 transition uppercase tracking-wider">
                    Confira aqui <ChevronRight className="size-4" />
                  </span>
                </div>
                <span className="absolute top-3 right-3 bg-accent/90 text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {t.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Produtos em destaque */}
      <section id="produtos" className="py-16 md:py-20 bg-secondary/50 border-y border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <span className="text-accent text-xs font-bold uppercase tracking-[0.25em]">Mais procurados</span>
              <h2 className="text-3xl md:text-4xl font-black mt-2" style={{ fontFamily: "Playfair Display, serif" }}>Destaques da Selaria</h2>
            </div>
            <Link to="/categorias" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-accent">
              Ver todos os produtos <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {destaques.map((p) => {
              const parcela = p.priceNumber / 12;
              return (
                <div key={p.slug} className="group bg-card rounded-lg overflow-hidden border border-border hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  <Link to="/produto/$slug" params={{ slug: p.slug }} className="relative aspect-square bg-secondary overflow-hidden block">
                    {p.oldPrice && (
                      <span className="absolute top-3 left-3 z-10 bg-accent text-accent-foreground text-[10px] font-bold uppercase px-2 py-1 rounded-sm tracking-wider">Oferta</span>
                    )}
                    <img src={p.image} alt={p.name} width={800} height={800} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </Link>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex gap-0.5 mb-2 text-accent">
                      {[...Array(5)].map((_, i) => <Star key={i} className="size-3 fill-current" />)}
                    </div>
                    <Link to="/produto/$slug" params={{ slug: p.slug }} className="font-semibold text-sm text-foreground mb-3 line-clamp-2 min-h-[2.5rem] hover:text-accent">
                      {p.name}
                    </Link>
                    <div className="mb-3">
                      {p.oldPrice && <div className="text-xs text-muted-foreground line-through">R$ {p.oldPrice}</div>}
                      <div className="text-xl font-black text-primary" style={{ fontFamily: "Playfair Display, serif" }}>{formatBRL(p.priceNumber)}</div>
                      <div className="text-xs text-muted-foreground">ou 12x de {formatBRL(parcela)}</div>
                    </div>
                    <div className="mt-auto flex flex-col sm:flex-row items-stretch gap-2">
                      <Link
                        to="/produto/$slug"
                        params={{ slug: p.slug }}
                        className="flex-1 min-w-0 inline-flex items-center justify-center h-10 px-2 rounded-full border border-border bg-secondary text-foreground text-[11px] font-bold uppercase tracking-wide hover:bg-foreground hover:text-background hover:border-foreground transition"
                      >
                        Detalhes
                      </Link>
                      <button
                        onClick={() => add({ slug: p.slug, name: p.name, image: p.image, price: p.priceNumber })}
                        className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 h-10 px-2 rounded-full bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wide shadow-sm hover:bg-accent hover:text-accent-foreground hover:shadow-md transition whitespace-nowrap"
                      >
                        <ShoppingBag className="size-3.5 shrink-0" />
                        Comprar
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tradição */}
      <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-accent text-xs font-bold uppercase tracking-[0.25em] mb-4 block">Feito em Minas</span>
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight" style={{ fontFamily: "Playfair Display, serif" }}>
              Couro que atravessa <span className="text-accent italic">gerações</span>
            </h2>
            <p className="text-primary-foreground/80 text-lg leading-relaxed mb-6">
              Nascida no coração das Vertentes mineiras, a Selaria Mineira preserva o ofício manual do couro há mais de quatro décadas. Cada sela leva mais de 40 horas de trabalho artesanal — costura dupla, ferragens em inox e couro de curtimento vegetal.
            </p>
            <ul className="space-y-3 mb-8">
              {["Couro bovino legítimo curtido ao natural", "Ferragens em aço inox e alpaca", "Garantia vitalícia na estrutura"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <span className="size-1.5 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
            <a href="#produtos" className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-md font-bold hover:brightness-110 transition">
              Ver produtos <ChevronRight className="size-4" />
            </a>
          </div>
          <div className="relative">
            <img src={destaques[0]?.image} alt={destaques[0]?.name ?? "Sela artesanal"} width={800} height={800} loading="lazy" className="w-full rounded-lg shadow-2xl" />
            <div className="absolute -bottom-6 -left-6 bg-accent text-accent-foreground p-6 rounded-lg shadow-xl hidden md:block">
              <div className="text-4xl font-black" style={{ fontFamily: "Playfair Display, serif" }}>+40</div>
              <div className="text-xs font-bold uppercase tracking-widest">Anos de tradição</div>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <span className="text-accent text-xs font-bold uppercase tracking-[0.25em]">Vozes das comitivas</span>
          <h2 className="text-3xl md:text-4xl font-black mt-2 mb-12" style={{ fontFamily: "Playfair Display, serif" }}>Quem monta com a gente, indica</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { nome: "Tiago Rezende", cidade: "Uberaba/MG", texto: "Já cruzei três estados com a sela que comprei aqui. Conforto pro cavalo e durabilidade que impressiona." },
              { nome: "João do Prado", cidade: "Barbacena/MG", texto: "O pesponto da cabeçada é obra de arte. Orgulho do artesanato mineiro em cada detalhe." },
              { nome: "Ricardo Mendes", cidade: "Lavras/MG", texto: "Minha bota aguenta barro, sol e continua impecável. Atendimento nota dez." },
            ].map((d) => (
              <div key={d.nome} className="bg-card p-8 rounded-lg border border-border text-left shadow-sm">
                <div className="flex gap-0.5 mb-4 text-accent">
                  {[...Array(5)].map((_, i) => <Star key={i} className="size-4 fill-current" />)}
                </div>
                <p className="text-muted-foreground italic mb-6 leading-relaxed">"{d.texto}"</p>
                <div className="pt-4 border-t border-border">
                  <div className="font-bold text-sm text-foreground">{d.nome}</div>
                  <div className="text-xs text-muted-foreground">{d.cidade}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA de contato */}
      <section className="py-14 bg-accent text-accent-foreground">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h3 className="text-2xl md:text-3xl font-black mb-1" style={{ fontFamily: "Playfair Display, serif" }}>Fale direto com a selaria</h3>
            <p className="opacity-90">Dúvidas sobre produtos, encomendas ou frete? Entre em contato por e-mail.</p>
          </div>
          <a href="mailto:contato@selariamineira.com.br" className="inline-flex items-center gap-3 bg-background text-foreground px-7 py-4 rounded-md font-bold shadow-lg hover:bg-background/90 transition">
            <Mail className="size-5" />
            Enviar e-mail
          </a>
        </div>
      </section>
    </StoreLayout>
  );
}
