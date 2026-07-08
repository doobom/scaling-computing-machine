import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  nameZh: string;
  nameEn: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const { items } = get();
        const existing = items.find((i) => i.id === item.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + (item.quantity ?? 1) } : i,
            ),
          });
        } else {
          set({ items: [...items, { ...item, quantity: item.quantity ?? 1 }] });
        }
      },
      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.id !== id) });
          return;
        }
        set({
          items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        });
      },
      clearCart: () => set({ items: [] }),
      get itemCount() {
        return get().items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
      },
      get subtotal() {
        return get().items.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'hk-life-store-cart',
    },
  ),
);
