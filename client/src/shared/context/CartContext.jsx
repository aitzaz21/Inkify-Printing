import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext(null);
const STORAGE_KEY = 'inkify_cart';

const loadCart = () => {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Unique key per cart line — includes designId so same product + different designs = separate lines
  const lineKey = (item) =>
    `${item.productId}__${item.color}__${item.size}__${item.designId || item.designUrl || 'none'}`;

  const addItem = useCallback((item) => {
    setItems((prev) => {
      const key = lineKey(item);
      const idx = prev.findIndex((i) => lineKey(i) === key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + (item.quantity || 1) };
        return next;
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
    toast.success('Added to cart');
  }, []);

  const updateQty = useCallback((key, qty) => {
    if (qty < 1) return;
    setItems((prev) => prev.map((i) => (lineKey(i) === key ? { ...i, quantity: qty } : i)));
  }, []);

  const removeItem = useCallback((key) => {
    setItems((prev) => prev.filter((i) => lineKey(i) !== key));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const count    = items.reduce((s, i) => s + i.quantity, 0);
  const shipping = items.length > 0 ? (subtotal >= 5000 ? 0 : 300) : 0; // PKR: free above 5000, else 300
  const total    = subtotal + shipping;

  return (
    <CartContext.Provider value={{
      items, addItem, updateQty, removeItem, clearCart,
      subtotal, shipping, total, count, lineKey,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
};
