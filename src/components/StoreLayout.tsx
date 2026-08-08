import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, ShieldCheck, Phone, Tag, Menu, X, MessageCircle, Instagram, Facebook, Youtube, MapPin, Mail } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { track } from "@/lib/track";
import { useCart } from "@/lib/cart";
import { FacebookPixel } from "@/components/FacebookPixel";
import logo from "@/assets/logo-selaria.png";

const WhatsAppIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.447-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export function StoreHeader() {
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const navLinks = (
    <>
      <Link to="/" onClick={() => setMenuOpen(false)} className="hover:text-accent transition">Início</Link>
      <Link to="/categorias" onClick={() => setMenuOpen(false)} className="hover:text-accent transition">Coleções</Link>
      <Link to="/categoria/$slug" params={{ slug: "selas" }} onClick={() => setMenuOpen(false)} className="hover:text-accent transition">Selas</Link>
      <Link to="/categoria/$slug" params={{ slug: "arreios-cabecadas" }} onClick={() => setMenuOpen(false)} className="hover:text-accent transition">Arreios</Link>
      <Link to="/categoria/$slug" params={{ slug: "cabrestos" }} onClick={() => setMenuOpen(false)} className="hover:text-accent transition">Cabrestos</Link>
      <Link to="/categoria/$slug" params={{ slug: "botinas" }} onClick={() => setMenuOpen(false)} className="hover:text-accent transition">Botinas</Link>
      <Link to="/categoria/$slug" params={{ slug: "acessorios" }} onClick={() => setMenuOpen(false)} className="hover:text-accent transition">Acessórios</Link>
      <Link to="/carrinho" onClick={() => setMenuOpen(false)} className="hover:text-accent transition">Carrinho</Link>
    </>
  );

  return (
    <>
      <header className="bg-background text-foreground sticky top-0 z-40 border-b-2 border-accent shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 md:py-4 grid grid-cols-[auto_1fr_auto] items-center gap-3 md:gap-5">
          {/* LEFT: menu (mobile) + contact/user (desktop xl) */}
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden bg-foreground/5 border border-foreground/15 rounded-md p-2 hover:bg-foreground/10 transition"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>

            <div className="hidden xl:flex items-center gap-3 text-xs">
              <a
                href="https://wa.me/5511977864885"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Falar no WhatsApp"
                className="flex items-center gap-2 text-foreground hover:text-accent transition"
              >
                <WhatsAppIcon className="size-5 text-accent shrink-0" />
                <div className="leading-tight">
                  <div className="opacity-70">Suporte</div>
                  <div className="font-bold">WhatsApp</div>
                </div>
              </a>
            </div>
            <div className="hidden xl:flex items-center gap-3 text-xs">
              <ShieldCheck className="size-5 text-accent shrink-0" />
              <div className="leading-tight">
                <div className="opacity-70">Compra sem cadastro</div>
                <div className="font-bold">Checkout rápido</div>
              </div>
            </div>

          </div>

          {/* CENTER: brand lockup */}
          <Link
            to="/"
            aria-label="Página inicial da Selaria Mineira"
            className="justify-self-center"
          >
            <div className="flex items-center gap-3 md:gap-4">
              <img
                src={logo}
                alt="Emblema da Selaria Mineira"
                width={80}
                height={80}
                className="size-12 shrink-0 rounded-full object-contain md:size-16 lg:size-20"
              />
              <div className="leading-none text-center">
                <div
                  className="font-black text-lg tracking-wide md:text-2xl lg:text-3xl"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  SELARIA
                </div>
                <div className="mt-1 text-[11px] font-bold tracking-[0.3em] text-accent md:text-sm lg:text-base">
                  MINEIRA
                </div>
              </div>
            </div>
          </Link>


          {/* RIGHT: search + cart */}
          <div className="flex items-center gap-2 justify-self-end">
            <button
              type="button"
              aria-label="Buscar"
              onClick={() => setSearchOpen((v) => !v)}
              className="md:hidden bg-foreground/5 border border-foreground/15 rounded-md p-2 hover:bg-foreground/10 transition"
            >
              <Search className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Buscar"
              onClick={() => setSearchOpen((v) => !v)}
              className="hidden md:grid xl:hidden bg-foreground/5 border border-foreground/15 rounded-md p-2.5 hover:bg-foreground/10 transition place-items-center"
            >
              <Search className="size-5" />
            </button>
            <Link
              to="/carrinho"
              aria-label="Carrinho"
              className="relative bg-foreground/5 border border-foreground/15 rounded-md p-2 md:p-2.5 hover:bg-foreground/10 transition"
            >
              <ShoppingBag className="size-5" />
              <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-bold size-5 grid place-items-center rounded-full">
                {count}
              </span>
            </Link>
          </div>

        </div>

        {/* Desktop search bar (below top row, centered) */}
        {searchOpen && (
          <div className="hidden md:block border-t border-foreground/10">
            <div className="max-w-3xl mx-auto px-4 py-3">
              <div className="relative">
                <input
                  autoFocus
                  type="search"
                  placeholder="Digite o que você procura"
                  className="w-full h-11 rounded-md bg-background text-foreground px-4 pr-12 text-sm outline-none focus:ring-2 focus:ring-accent"
                />
                <button className="absolute right-1 top-1 bottom-1 px-3 bg-accent text-accent-foreground rounded-md grid place-items-center">
                  <Search className="size-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {searchOpen && (
          <div className="md:hidden px-3 pb-3">
            <div className="relative">
              <input
                autoFocus
                type="search"
                placeholder="Digite o que você procura"
                className="w-full h-11 rounded-md bg-background text-foreground px-4 pr-12 text-sm outline-none focus:ring-2 focus:ring-accent"
              />
              <button className="absolute right-1 top-1 bottom-1 px-3 bg-accent text-accent-foreground rounded-md grid place-items-center">
                <Search className="size-4" />
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-foreground/10 hidden md:block bg-foreground/[0.03]">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center">
            <nav className="flex items-center gap-8 text-sm font-medium">
              {navLinks}
            </nav>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-foreground/10 bg-background">

            <nav className="flex flex-col px-4 py-3 gap-3 text-sm font-medium">
              {navLinks}
              <a href="/#produtos" onClick={() => setMenuOpen(false)} className="mt-2 inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-4 py-2.5 rounded-md font-bold">
                <Tag className="size-4" /> Ofertas Especiais
              </a>
            </nav>
          </div>
        )}
      </header>

    </>
  );
}

export function StoreFooter() {
  return (
    <footer className="bg-foreground text-background/80 pt-16 pb-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-10 mb-12">
        <div>
          <div className="font-black text-lg text-background mb-3" style={{ fontFamily: "Playfair Display, serif" }}>
            SELARIA <span className="text-accent">MINEIRA</span>
          </div>
          <p className="text-sm mb-4">Tradição em couro há mais de 40 anos no coração de Minas Gerais.</p>
          <div className="flex gap-3">
            <a href="#" aria-label="Instagram" className="size-9 rounded-full border border-background/20 grid place-items-center hover:bg-accent hover:border-accent transition"><Instagram className="size-4" /></a>
            <a href="#" aria-label="Facebook" className="size-9 rounded-full border border-background/20 grid place-items-center hover:bg-accent hover:border-accent transition"><Facebook className="size-4" /></a>
            <a href="#" aria-label="YouTube" className="size-9 rounded-full border border-background/20 grid place-items-center hover:bg-accent hover:border-accent transition"><Youtube className="size-4" /></a>
          </div>
        </div>
        <div>
          <h4 className="font-bold text-background mb-4 text-sm uppercase tracking-widest">Institucional</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-accent transition">Sobre nós</a></li>
            <li><a href="#" className="hover:text-accent transition">Formas de pagamento</a></li>
            <li><a href="#" className="hover:text-accent transition">Trocas e devoluções</a></li>
            <li><a href="#" className="hover:text-accent transition">Política de privacidade</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-background mb-4 text-sm uppercase tracking-widest">Categorias</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/#produtos" className="hover:text-accent transition">Selas</a></li>
            <li><a href="/#produtos" className="hover:text-accent transition">Arreios</a></li>
            <li><a href="/#produtos" className="hover:text-accent transition">Botas e Chapéus</a></li>
            <li><a href="/#produtos" className="hover:text-accent transition">Acessórios</a></li>
          </ul>
        </div>
          <div>
            <h4 className="font-bold text-background mb-4 text-sm uppercase tracking-widest">Contato</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2"><MapPin className="size-4 text-accent mt-0.5 shrink-0" /> Vertentes, Minas Gerais</li>
              <li className="flex items-start gap-2"><Mail className="size-4 text-accent mt-0.5 shrink-0" /> contato@selariamineira.com.br</li>
              <li>
                <a
                  href="https://wa.me/5511977864885"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Falar no WhatsApp"
                  className="inline-flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#1ebe57] transition"
                >
                  <WhatsAppIcon className="size-4" />
                  Fale no WhatsApp
                </a>
              </li>
            </ul>
          </div>
      </div>

      <div className="border-t border-background/10 pt-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs">
          © {new Date().getFullYear()} Selaria Mineira. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}

export function StoreLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (pathname.startsWith("/produto/")) track("product", { label: decodeURIComponent(pathname.replace("/produto/", "")) });
    else if (pathname.startsWith("/carrinho")) track("cart");
    else if (!pathname.startsWith("/checkout")) track("visit");
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" style={{ fontFamily: "Inter, sans-serif" }}>
      <FacebookPixel />
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  );
}
