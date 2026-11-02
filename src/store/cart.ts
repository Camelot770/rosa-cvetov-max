import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/client';
import { fmt } from '../utils/format';

const MAX_QUANTITY = 50;

export interface CartItem {
  id: string;
  bouquetId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  notices: string[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalPrice: () => number;
  totalItems: () => number;
  syncItems: () => Promise<void>;
  dismissNotices: () => void;
}

const fetchBouquet = (id: number) =>
  api.get(`/bouquets/${id}`).then(
    ({ data }) => ({ id, bouquet: data, gone: false }),
    // Only a 404 means the bouquet is gone. A network problem leaves the cart as it is.
    (err) => ({ id, bouquet: null, gone: err?.response?.status === 404 }),
  );

let syncInFlight: Promise<void> | null = null;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      notices: [],

      addItem: (item) => {
        const existing = get().items.find((i) => i.id === item.id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === item.id ? { ...i, quantity: Math.min(i.quantity + 1, MAX_QUANTITY) } : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, quantity: 1 }] });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.id !== id) });
        } else {
          set({
            items: get().items.map((i) =>
              i.id === id ? { ...i, quantity: Math.min(quantity, MAX_QUANTITY) } : i
            ),
          });
        }
      },

      clearCart: () => set({ items: [], notices: [] }),

      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      // Compares the cart with the catalog: prices and names change, bouquets run out
      syncItems: () => {
        if (!syncInFlight) {
          syncInFlight = (async () => {
            const ids = [...new Set(get().items.map((i) => i.bouquetId))];
            if (ids.length === 0) return;
            const results = new Map((await Promise.all(ids.map(fetchBouquet))).map((r) => [r.id, r]));

            const notices: string[] = [];
            const items: CartItem[] = [];
            for (const item of get().items) {
              const result = results.get(item.bouquetId);
              const bouquet = result?.bouquet;
              if (result?.gone) {
                notices.push(`«${item.name}» больше нет в каталоге, мы убрали его из корзины.`);
              } else if (!bouquet) {
                items.push(item);
              } else if (!bouquet.inStock && !bouquet.customOrder) {
                notices.push(`«${bouquet.name}» сейчас нет в наличии, мы убрали его из корзины.`);
              } else {
                if (bouquet.price !== item.price) {
                  notices.push(`Цена «${bouquet.name}» изменилась: теперь ${fmt(bouquet.price)}.`);
                }
                items.push({
                  ...item,
                  name: bouquet.name,
                  price: bouquet.price,
                  image: bouquet.images?.[0]?.url ?? item.image,
                });
              }
            }
            set({ items, notices: [...new Set([...get().notices, ...notices])] });
          })().finally(() => {
            syncInFlight = null;
          });
        }
        return syncInFlight;
      },

      dismissNotices: () => set({ notices: [] }),
    }),
    {
      name: 'rosa-cart',
      // v2: the catalog was re-seeded with new ids, so older carts point at other bouquets
      version: 2,
      migrate: () => ({ items: [] }),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
