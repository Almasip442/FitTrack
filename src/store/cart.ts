/**
 * Cart Zustand store — F9.5
 *
 * Persists to localStorage so the cart survives page refreshes.
 * Must only be accessed from 'use client' components.
 */

import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { Product } from '@/types/database'

export type CartItem = {
  product: Product
  quantity: number
}

type CartStore = {
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalPrice: () => number
  totalItems: () => number
}

// `createJSONStorage(() => window.localStorage)` returns undefined during
// server rendering, which removes the persist API from the server store.
// Keep a no-op storage available on the server so SSR can safely call the
// store's hydration helpers; the browser uses localStorage as usual.
const serverStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (item) => item.product.id === product.id,
          )
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item,
              ),
            }
          }
          return {
            items: [...state.items, { product, quantity }],
          }
        })
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }))
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item,
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      totalPrice: () => {
        return get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0,
        )
      },

      totalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'fittrack-cart',
      storage: createJSONStorage(() =>
        typeof window === 'undefined' ? serverStorage : window.localStorage,
      ),
      // SSR-safety: don't hydrate from localStorage during the server render.
      // The CartDrawer triggers `useCartStore.persist.rehydrate()` after mount
      // so the server- and client-rendered markup match (no hydration warnings,
      // no badge flash before persisted state is read).
      skipHydration: true,
    },
  ),
)
