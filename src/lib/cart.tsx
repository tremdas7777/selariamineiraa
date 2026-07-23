import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  slug: string;
  name: string;
  image: string;
  price: number;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "selaria-mineira-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    add: (item, qty = 1) =>
      setItems((prev) => {
        const found = prev.find((p) => p.slug === item.slug);
        if (found) return prev.map((p) => (p.slug === item.slug ? { ...p, qty: p.qty + qty } : p));
        return [...prev, { ...item, qty }];
      }),
    remove: (slug) => setItems((prev) => prev.filter((p) => p.slug !== slug)),
    setQty: (slug, qty) =>
      setItems((prev) =>
        qty <= 0
          ? prev.filter((p) => p.slug !== slug)
          : prev.map((p) => (p.slug === slug ? { ...p, qty } : p)),
      ),
    clear: () => setItems([]),
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal: items.reduce((s, i) => s + i.qty * i.price, 0),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
