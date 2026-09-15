"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = { productId: string; name: string; slug: string; price: number; imageUrl: string | null; quantity: number };
const CART_KEY = "kollaam_cart";
const ACTIVE_CUSTOMER_KEY = "kollaam_customer_active";

type CartContextValue = {
  items: CartItem[]; itemCount: number; subtotal: number; isActiveCustomer: boolean;
  addItem: (item: Omit<CartItem, "quantity">) => boolean;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void; clearCart: () => void;
};
const CartContext = createContext<CartContextValue | null>(null);

export function CustomerCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isActiveCustomer, setIsActiveCustomer] = useState(false);

  useEffect(() => {
    const load = () => {
      try {
        const stored = localStorage.getItem(CART_KEY);
        if (stored) { const parsed = JSON.parse(stored); if (Array.isArray(parsed)) setItems(parsed); }
        setIsActiveCustomer(localStorage.getItem(ACTIVE_CUSTOMER_KEY) === "1");
      } catch {}
    };
    load();
    const refresh = () => setIsActiveCustomer(localStorage.getItem(ACTIVE_CUSTOMER_KEY) === "1");
    const refreshCart = () => {
      try { const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); if (Array.isArray(parsed)) setItems(parsed); } catch {}
    };
    window.addEventListener("kollaam-customer-active", refresh);
    window.addEventListener("kollaam-cart-updated", refreshCart);
    window.addEventListener("storage", () => { refresh(); refreshCart(); });
    return () => {
      window.removeEventListener("kollaam-customer-active", refresh);
      window.removeEventListener("kollaam-cart-updated", refreshCart);
    };
  }, []);

  useEffect(() => { try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch {} }, [items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    isActiveCustomer,
    addItem: (item) => {
      if (!isActiveCustomer) return false;
      setItems((current) => {
        const existing = current.find((entry) => entry.productId === item.productId);
        return existing
          ? current.map((entry) => entry.productId === item.productId ? { ...entry, quantity: entry.quantity + 1 } : entry)
          : [...current, { ...item, quantity: 1 }];
      });
      return true;
    },
    updateQuantity: (productId, quantity) => setItems((current) => quantity <= 0 ? current.filter((item) => item.productId !== productId) : current.map((item) => item.productId === productId ? { ...item, quantity } : item)),
    removeItem: (productId) => setItems((current) => current.filter((item) => item.productId !== productId)),
    clearCart: () => setItems([]),
  }), [items, isActiveCustomer]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCustomerCart() { const context = useContext(CartContext); if (!context) throw new Error("useCustomerCart must be used inside CustomerCartProvider"); return context; }
export const CUSTOMER_ACTIVE_KEY = ACTIVE_CUSTOMER_KEY;
