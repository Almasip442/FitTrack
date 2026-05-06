import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------
// GET /api/food-search?q=<term>
//
// Server-side proxy for the Hungarian Open Food Facts search API.
// Normalises the upstream payload into a small, frontend-friendly
// shape: per-100g calories + macros, with a clean Hungarian product
// name where available.
//
// Public endpoint — no auth required (no user data is returned).
//
// Errors:
//   400  q missing / too long
//   503  Open Food Facts unreachable, timed out, or returned non-OK
// ---------------------------------------------------------------------

const OFF_BASE = 'https://hu.openfoodfacts.org/cgi/search.pl'
const PAGE_SIZE = 15
const MAX_QUERY_LEN = 100
const TIMEOUT_MS = 5000

export type FoodSearchResult = {
  name: string
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
}

/* -------------------------------------------------------------------------- */
/*  Open Food Facts response shape (only the fields we care about)             */
/* -------------------------------------------------------------------------- */

type OffNutriments = {
  // Open Food Facts normalises kcal/100g under `energy-kcal_100g`. Some
  // older entries only expose kJ values, so we accept both and convert.
  'energy-kcal_100g'?: number | string
  'energy-kj_100g'?: number | string
  proteins_100g?: number | string
  carbohydrates_100g?: number | string
  fat_100g?: number | string
}

type OffProduct = {
  product_name?: string | null
  product_name_hu?: string | null
  nutriments?: OffNutriments | null
}

type OffSearchResponse = {
  products?: OffProduct[]
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Coerce a possibly-string numeric field to a finite non-negative number. */
function toNumber(value: number | string | undefined | null): number {
  if (value === undefined || value === null) return 0
  const n = typeof value === 'number' ? value : parseFloat(value)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

/** Round a macro/calorie value to 1 decimal place. */
function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * Pick the best name for a product, preferring the Hungarian variant.
 * Returns null when nothing usable is available — such items are
 * dropped from the response.
 */
function pickName(p: OffProduct): string | null {
  const hu = p.product_name_hu?.trim()
  if (hu) return hu
  const fallback = p.product_name?.trim()
  if (fallback) return fallback
  return null
}

/**
 * Convert an Open Food Facts product to the normalised response shape.
 * Returns null for entries without a usable name. Calories are derived
 * from kcal when present and from kJ otherwise (1 kcal ≈ 4.184 kJ).
 */
function normaliseProduct(p: OffProduct): FoodSearchResult | null {
  const name = pickName(p)
  if (!name) return null

  const n = p.nutriments ?? {}

  let kcal = toNumber(n['energy-kcal_100g'])
  if (kcal === 0) {
    const kj = toNumber(n['energy-kj_100g'])
    if (kj > 0) kcal = kj / 4.184
  }

  return {
    name,
    calories_per_100g: round1(kcal),
    protein_per_100g: round1(toNumber(n.proteins_100g)),
    carbs_per_100g: round1(toNumber(n.carbohydrates_100g)),
    fat_per_100g: round1(toNumber(n.fat_100g)),
  }
}

/* -------------------------------------------------------------------------- */
/*  Route handler                                                              */
/* -------------------------------------------------------------------------- */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''

  if (!q) {
    return NextResponse.json(
      { error: 'A keresési kifejezés kötelező.' },
      { status: 400 },
    )
  }
  if (q.length > MAX_QUERY_LEN) {
    return NextResponse.json(
      { error: `A keresési kifejezés túl hosszú (max ${MAX_QUERY_LEN} karakter).` },
      { status: 400 },
    )
  }

  // Build the upstream URL. We constrain the response with `fields` so
  // OFF only ships the columns we actually consume.
  const upstream = new URL(OFF_BASE)
  upstream.searchParams.set('search_terms', q)
  upstream.searchParams.set('json', 'true')
  upstream.searchParams.set('page_size', String(PAGE_SIZE))
  upstream.searchParams.set('fields', 'product_name,product_name_hu,nutriments')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(upstream.toString(), {
      signal: controller.signal,
      // OFF is a public dataset; cache successful responses briefly to
      // soak up repeat searches without hammering the upstream API.
      next: { revalidate: 300 },
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'A keresés jelenleg nem elérhető' },
        { status: 503 },
      )
    }

    const json = (await res.json()) as OffSearchResponse
    const products = Array.isArray(json.products) ? json.products : []

    const results: FoodSearchResult[] = []
    for (const p of products) {
      const normalised = normaliseProduct(p)
      if (normalised) results.push(normalised)
    }

    return NextResponse.json(results)
  } catch {
    // AbortError, network failure, JSON parse error — collapse to 503
    // so the frontend has a single failure mode to handle.
    return NextResponse.json(
      { error: 'A keresés jelenleg nem elérhető' },
      { status: 503 },
    )
  } finally {
    clearTimeout(timer)
  }
}
