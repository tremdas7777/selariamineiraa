import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { StoreLayout } from "@/components/StoreLayout";
import { useCart } from "@/lib/cart";
import { useStartCheckout } from "@/lib/useCheckout";

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
  const { count } = useCart();
  const navigate = useNavigate();
  const { startCheckout } = useStartCheckout();
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("checkout-error");
    if (stored) {
      sessionStorage.removeItem("checkout-error");
      try {
        const parsed = JSON.parse(stored) as { error?: string; missing?: string[] };
        setError(parsed.error ?? "Não foi possível abrir o checkout.");
        setMissing(parsed.missing ?? []);
      } catch {
        setError("Não foi possível abrir o checkout.");
      }
      return;
    }

    navigate({ to: "/carrinho", replace: true });
  }, [navigate]);

  if (!error) return null;

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
            onClick={() => {
              setError(null);
              setMissing([]);
              void startCheckout();
            }}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-bold"
          >
            Tentar novamente
          </button>
          <Link to="/carrinho" className="border border-border px-6 py-3 rounded-md font-bold">
            Voltar ao carrinho
          </Link>
        </div>
      </div>
    </StoreLayout>
  );
}
