import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, User, Phone, Tag, Menu, X, MessageCircle, Instagram, Facebook, Youtube, MapPin, Mail } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useCart } from "@/lib/cart";
import logo from "@/assets/logo-selaria.png";

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
      <Link to="/categoria/$slug" params={{ slug: "acessorios" }} onClick={() => setMenuOpen(false)} className="hover:text-accent transition">Acessórios</Link>
      <Link to="/carrinho" onClick={() => setMenuOpen(false)} className="hover:text-accent transition">Carrinho</Link>
    </>
  );

  return (
    <>
      <div className="bg-accent text-accent-foreground text-[11px] sm:text-sm font-bold">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-center uppercase tracking-wider">
          <Tag className="size-4 shrink-0" />
          <span>Promoção Especial • 50% OFF em toda a loja</span>
          <span className="opacity-60">|</span>
          <span>+10% no PIX</span>
        </div>
      </div>

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
              <Phone className="size-5 text-accent shrink-0" />
              <div className="leading-tight">
                <div className="opacity-70">Central de</div>
                <div className="font-bold">Atendimento</div>
              </div>
            </div>
            <div className="hidden xl:flex items-center gap-3 text-xs">
              <User className="size-5 text-accent shrink-0" />
              <div className="leading-tight">
                <div className="opacity-70">Olá, Bem-vindo(a)</div>
                <div className="font-bold">Entre ou Cadastre-se</div>
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
            <li className="flex items-start gap-2"><Phone className="size-4 text-accent mt-0.5 shrink-0" /> (32) 99962-7541</li>
            <li className="flex items-start gap-2"><Mail className="size-4 text-accent mt-0.5 shrink-0" /> contato@selariamineira.com.br</li>
            <li className="flex items-start gap-2"><MessageCircle className="size-4 text-accent mt-0.5 shrink-0" /> WhatsApp 24h</li>
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
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" style={{ fontFamily: "Inter, sans-serif" }}>
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  );
}
