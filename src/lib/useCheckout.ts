import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { useCart, type CartItem } from "./cart";
import { startZedyCheckout } from "./zedy.functions";
import { track } from "./track";

export function useStartCheckout() {
  const { items } = useCart();
  const start = useServerFn(startZedyCheckout);
  const navigate = useNavigate();

  const startCheckout = useCallback(
    async (cartItems?: CartItem[]) => {
      const checkoutItems = cartItems ?? items;
      if (checkoutItems.length === 0) return;

      track("checkout", { label: `${checkoutItems.length} itens` });

      const res = await start({
        data: { items: checkoutItems.map((i) => ({ title: i.name, quantity: i.qty })) },
      });
      if (res.ok) {
        window.location.href = res.url;
        return;
      }
      sessionStorage.setItem(
        "checkout-error",
        JSON.stringify({
          error:
            res.missing.length > 0
              ? "Alguns itens do carrinho ainda não estão disponíveis para compra."
              : (res.error ?? "Não foi possível abrir o checkout."),
          missing: res.missing,
        }),
      );
      navigate({ to: "/checkout" });
    },
    [items, start, navigate],
  );

  return { startCheckout };
}
