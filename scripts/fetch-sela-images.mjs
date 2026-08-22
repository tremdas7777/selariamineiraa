/**
 * Busca todas as imagens das selas no site selariacavaloreal.com.br
 * e atualiza src/data/products.json com o campo images[].
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const productsPath = join(__dirname, "../src/data/products.json");

const PLACEHOLDER = /personaliza-o-de-cortesia|design-sem-nome/i;
const UA = { "User-Agent": "Mozilla/5.0 (compatible; SelariaMineira/1.0)" };

function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractImages(html) {
  const urls = [...html.matchAll(/data-imagem-grande="(https:\/\/cdn\.awsli\.com\.br\/[^"]+)"/g)].map((m) => m[1]);
  const unique = [...new Set(urls)];
  const real = unique.filter((u) => !PLACEHOLDER.test(u));
  const images = real.length > 0 ? real : unique;
  return images.map((u) => u.replace(/\/\d+x\d+\//, "/800x800/"));
}

function extractTitle(html) {
  const h1 = html.match(/<h1[^>]*class="[^"]*nome[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return h1[1].replace(/<[^>]+>/g, "").trim();
  const og = html.match(/property="og:title"\s+content="([^"]+)"/);
  if (og) return og[1].replace(/\s*\|\s*Selaria.*$/i, "").trim();
  const title = html.match(/<title>([^<]+)<\/title>/);
  return title?.[1]?.replace(/\s*\|\s*Selaria.*$/i, "").trim() ?? "";
}

function nameScore(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 100;
  if (na.includes(nb) || nb.includes(na)) return 90;

  const wa = new Set(na.split(" ").filter((w) => w.length > 2));
  const wb = new Set(nb.split(" ").filter((w) => w.length > 2));
  let shared = 0;
  for (const w of wa) if (wb.has(w)) shared++;
  const score = (shared / Math.max(wa.size, wb.size)) * 100;
  return score;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: UA, redirect: "follow" });
  if (!res.ok) return null;
  return res.text();
}

async function crawlSelasCatalog() {
  const catalog = [];
  const seenUrls = new Set();

  for (let page = 1; page <= 3; page++) {
    const listUrl =
      page === 1
        ? "https://www.selariacavaloreal.com.br/selas"
        : `https://www.selariacavaloreal.com.br/selas?pagina=${page}`;
    const html = await fetchText(listUrl);
    if (!html) break;

    const links = new Set();
    for (const m of html.matchAll(/href="(https:\/\/www\.selariacavaloreal\.com\.br\/[^"?#]+)"/g)) {
      links.add(m[1]);
    }
    for (const m of html.matchAll(/href="(\/[a-z0-9][^"?#]*)"/gi)) {
      if (m[1].length > 2) links.add(`https://www.selariacavaloreal.com.br${m[1]}`);
    }

    for (const link of links) {
      if (seenUrls.has(link)) continue;
      if (/(\/selas|\/arreios|\/contato|\/carrinho|\/conta|\/login|\/politica|\/quem-somos)/.test(link)) continue;
      seenUrls.add(link);

      const pageHtml = await fetchText(link);
      if (!pageHtml?.includes("data-imagem-grande")) continue;

      const images = extractImages(pageHtml);
      if (images.length === 0) continue;

      const title = extractTitle(pageHtml);
      const idMatch = pageHtml.match(/produto\/(\d+)\//);
      catalog.push({ url: link, title, images, productId: idMatch?.[1] ?? null });
    }
  }

  return catalog;
}

async function main() {
  console.log("Rastreando catálogo de selas no site de origem...\n");
  const catalog = await crawlSelasCatalog();
  console.log(`Encontrados ${catalog.length} produtos com galeria.\n`);

  const products = JSON.parse(readFileSync(productsPath, "utf8"));
  const selas = products.filter((p) => /\bsela\b/i.test(p.name));

  for (const product of selas) {
    process.stdout.write(`${product.name.slice(0, 55).padEnd(55)} `);

    const productId = product.image.match(/produto\/(\d+)\//)?.[1];

    let match =
      catalog.find((c) => c.productId === productId) ??
      catalog.reduce(
        (best, c) => {
          const score = nameScore(product.name, c.title);
          return score > (best?.score ?? 0) ? { ...c, score } : best;
        },
        null,
      );

    if (!match || (match.score !== undefined && match.score < 60)) {
      console.log("✗ produto não encontrado no catálogo");
      continue;
    }

    product.images = match.images;
    product.image = match.images[0];
    console.log(`✓ ${match.images.length} imagens`);
  }

  writeFileSync(productsPath, JSON.stringify(products, null, 2) + "\n");
  console.log("\nproducts.json atualizado.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
