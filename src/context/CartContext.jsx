import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const CART_KEY = 'ml-cart-v1';

/** Per-tab cart so different logged-in roles do not share basket state. */
function readCart() {
  try {
    const raw = sessionStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => readCart());

  useEffect(() => {
    try {
      sessionStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const value = useMemo(() => {
    function addItem(product, qty = 1) {
      const quantity = Math.max(1, Number(qty) || 1);
      setItems((prev) => {
        const id = product.product_id;
        const existing = prev.find((x) => x.product_id === id);
        if (existing) {
          return prev.map((x) =>
            x.product_id === id ? { ...x, quantity: x.quantity + quantity } : x
          );
        }
        return [
          ...prev,
          {
            product_id: id,
            farmer_id: product.farmer_id,
            name: product.name,
            price: Number(product.price),
            unit: product.unit || 'kg',
            farmer_name: product.farmer_name || 'Local farmer',
            image_url: product.image_url || null,
            quantity,
          },
        ];
      });
    }

    function removeItem(productId) {
      setItems((prev) => prev.filter((x) => x.product_id !== productId));
    }

    function updateQty(productId, quantity) {
      const q = Math.max(1, Number(quantity) || 1);
      setItems((prev) => prev.map((x) => (x.product_id === productId ? { ...x, quantity: q } : x)));
    }

    function clear() {
      setItems([]);
    }

    const count = items.reduce((s, x) => s + x.quantity, 0);
    const total = items.reduce((s, x) => s + x.price * x.quantity, 0);

    return { items, addItem, removeItem, updateQty, clear, count, total };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
