import raw from "@/data/products.json";

export type RawProduct = { name: string; image: string; price: string; oldPrice: string | null };
export type Product = RawProduct & { slug: string; priceNumber: number; category: CategorySlug };

export type CategorySlug = "selas" | "arreios-cabecadas" | "cabrestos" | "esporas-freios" | "mantas-perneiras" | "acessorios";

export const categories: { slug: CategorySlug; name: string; description: string }[] = [
  { slug: "selas", name: "Selas", description: "Selas mangalarga, australianas, americanas e de prova de laço." },
  { slug: "arreios-cabecadas", name: "Arreios & Cabeçadas", description: "Arreios, cabeçadas e peitorais em couro legítimo." },
  { slug: "cabrestos", name: "Cabrestos", description: "Cabrestos trançados, de corda, corrente e inox." },
  { slug: "esporas-freios", name: "Esporas & Freios", description: "Esporas, bridões e freios em inox." },
  { slug: "mantas-perneiras", name: "Mantas & Perneiras", description: "Mantas de pelúcia, perneiras e proteções em couro." },
  { slug: "acessorios", name: "Acessórios", description: "Suportes, raspadeiras e demais acessórios para o cavaleiro." },
];

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const parseBRL = (s: string) =>
  parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0;

export const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function inferCategory(name: string): CategorySlug {
  const n = name.toLowerCase();
  if (/\bsela\b/.test(n)) return "selas";
  if (/cabresto/.test(n)) return "cabrestos";
  if (/cabe[çc]ada|peitoral|arreio/.test(n)) return "arreios-cabecadas";
  if (/espora|brid[ãa]o|freio/.test(n)) return "esporas-freios";
  if (/manta|perneira/.test(n)) return "mantas-perneiras";
  return "acessorios";
}

const seen = new Map<string, number>();
export const products: Product[] = (raw as RawProduct[]).map((p) => {
  let slug = slugify(p.name);
  const count = seen.get(slug) ?? 0;
  seen.set(slug, count + 1);
  if (count > 0) slug = `${slug}-${count + 1}`;
  return { ...p, slug, priceNumber: parseBRL(p.price), category: inferCategory(p.name) };
});

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const getProductsByCategory = (slug: CategorySlug) => products.filter((p) => p.category === slug);

export type SelaTipo = "mangalarga" | "australiana" | "americana" | "cabeca" | "laco" | "marchador" | "pista";

export const selaTipos: { slug: SelaTipo; name: string; match: RegExp; description: string }[] = [
  { slug: "mangalarga", name: "Mangalarga", match: /mangalarga/i, description: "Selas mangalarga para a lida e a marcha." },
  { slug: "australiana", name: "Australiana", match: /australiana/i, description: "Selas australianas com pelego e bastos reforçados." },
  { slug: "americana", name: "Americana", match: /americana/i, description: "Selas americanas entalhadas para prova e passeio." },
  { slug: "cabeca", name: "De Cabeça", match: /de cabe[çc]a|s[ãa]o carlos/i, description: "Selas de cabeça São Carlos, gel e couro legítimo." },
  { slug: "laco", name: "Prova de Laço", match: /la[çc]o/i, description: "Selas de laço em couro virado e reforçado." },
  { slug: "marchador", name: "Marchador", match: /marchador/i, description: "Selas para cavalo marchador e cavalgadas longas." },
  { slug: "pista", name: "Pista & Competição", match: /pista|competi/i, description: "Selas leves para pista, treinamento e competição." },
];

export const getSelaTipo = (slug: string) => selaTipos.find((t) => t.slug === slug);
export const getSelasByTipo = (slug: SelaTipo) => {
  const t = getSelaTipo(slug);
  if (!t) return [];
  return products.filter((p) => p.category === "selas" && t.match.test(p.name));
};


