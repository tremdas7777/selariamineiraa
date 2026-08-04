import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, Lock } from "lucide-react";
import { StoreLayout } from "@/components/StoreLayout";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/products";
import { startZedyCheckout } from "@/lib/zedy.functions";
import { track } from "@/lib/track";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Selaria Mineira" },
      { name: "description", content: "Finalize seu pedido com segurança no checkout da Selaria Mineira." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal, count } = useCart();
  const start = useServerFn(startZedyCheckout);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const startedRef = useRef(false);

  const go = async () => {
    setError(null);
    setMissing([]);
    const res = await start({
      data: { items: items.map((i) => ({ title: i.name, quantity: i.qty })) },
    });
    if (res.ok) {
      window.location.href = res.url;
      return;
    }
    if (res.missing.length > 0) {
      setMissing(res.missing);
      setError("Alguns itens do carrinho ainda não estão disponíveis para compra.");
    } else {
      setError(res.error ?? "Não foi possível abrir o checkout.");
    }
  };

  useEffect(() => {
    if (startedRef.current || items.length === 0) return;
    startedRef.current = true;
    track("checkout", { label: `${items.length} itens` });
    void go();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

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
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        {!error ? (
          <>
            <Loader2 className="size-10 text-primary animate-spin mx-auto mb-6" />
            <h1 className="text-3xl font-black mb-3" style={{ fontFamily: "Playfair Display, serif" }}>
              Levando você ao pagamento…
            </h1>
            <p className="text-muted-foreground">
              Total do pedido: <strong>{formatBRL(subtotal)}</strong>
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="size-3.5" /> Ambiente de pagamento seguro
            </p>
          </>
        ) : (
          <>
            <AlertCircle className="size-10 text-destructive mx-auto mb-6" />
            <h1 className="text-2xl font-black mb-3" style={{ fontFamily: "Playfair Display, serif" }}>
              Não foi possível abrir o pagamento
            </h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            {missing.length > 0 && (
              <ul className="text-sm text-muted-foreground bg-secondary/50 rounded-md p-3 text-left mb-6">
                {missing.map((m) => <li key={m}>• {m}</li>)}
              </ul>
            )}
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => void go()}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-bold"
              >
                Tentar novamente
              </button>
              <Link to="/carrinho" className="border border-border px-6 py-3 rounded-md font-bold">
                Voltar ao carrinho
              </Link>
            </div>
          </>
        )}
      </div>
    </StoreLayout>
  );
}
