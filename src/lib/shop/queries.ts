/**
 * Shop / webshop read-side queries — server-only.
 *
 * Backend Iteration 13 / Tasks 13.2, 13.3, 13.6.
 *
 * Uses the cookie-bound Supabase server client so RLS evaluates against
 * the caller's session. Callers should be Server Components, Server
 * Actions, or Route Handlers.
 *
 * RLS contract (see `20260430000003_rls_policies.sql`):
 *   - `products`: public SELECT (`USING (true)`)
 *   - `orders`:   `auth.uid() = user_id` SELECT
 */

import { createClient } from '@/lib/supabase/server'
import type { Database, Order, Product } from '@/types/database'

type ProductCategory = NonNullable<
  Database['public']['Tables']['products']['Row']['category']
>

const VALID_CATEGORIES: readonly ProductCategory[] = [
  'protein',
  'kreatin',
  'vitamin',
  'aminosav',
  'egyéb',
]

function asCategory(value: string): ProductCategory | null {
  return (VALID_CATEGORIES as readonly string[]).includes(value)
    ? (value as ProductCategory)
    : null
}

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type ProductSortBy = 'price_asc' | 'price_desc' | 'name'

export type ProductFilters = {
  category?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: ProductSortBy
}

/* -------------------------------------------------------------------------- */
/*  Auth helper                                                                */
/* -------------------------------------------------------------------------- */

async function requireUserId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

/* -------------------------------------------------------------------------- */
/*  Products                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Return the active product catalog with optional filters and sorting.
 *
 * Only `is_active = true` products are returned. Default sort order is
 * by `name` ascending.
 */
export async function getProducts(
  filters?: ProductFilters,
): Promise<Product[]> {
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)

  if (filters?.category) {
    const cat = asCategory(filters.category)
    if (cat) query = query.eq('category', cat)
  }
  if (filters?.minPrice !== undefined && Number.isFinite(filters.minPrice)) {
    query = query.gte('price', filters.minPrice)
  }
  if (filters?.maxPrice !== undefined && Number.isFinite(filters.maxPrice)) {
    query = query.lte('price', filters.maxPrice)
  }

  switch (filters?.sortBy) {
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    case 'name':
    default:
      query = query.order('name', { ascending: true })
      break
  }

  const { data, error } = await query
  if (error) {
    throw new Error(`Failed to load products: ${error.message}`)
  }
  return data ?? []
}

/**
 * Return a single product by id, or `null` when not found / inactive.
 */
export async function getProduct(productId: string): Promise<Product | null> {
  if (!productId) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load product: ${error.message}`)
  }
  return data
}

/* -------------------------------------------------------------------------- */
/*  Orders                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Return every order placed by the current user, newest first. Returns
 * an empty array when the user is unauthenticated.
 */
export async function getUserOrders(): Promise<Order[]> {
  const userId = await requireUserId()
  if (!userId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load orders: ${error.message}`)
  }
  return data ?? []
}
