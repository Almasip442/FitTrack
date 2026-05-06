import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------
// POST /api/checkout
//
// Body:  { items: Array<{ product_id: string; quantity: number }> }
// Auth:  required (cookie-bound Supabase session)
//
// Creates a Stripe Checkout Session in HUF for the given cart and
// returns the redirect URL. The actual `orders` / `order_items` rows
// are written by the Stripe webhook handler once payment succeeds —
// this endpoint never persists order rows itself.
//
// Errors:
//   400  invalid body, empty cart, too many items, unknown product id
//   401  unauthenticated
//   500  Supabase / Stripe failure
// ---------------------------------------------------------------------

export const runtime = 'nodejs'

const MAX_ITEMS = 50

type CheckoutItem = {
  product_id: string
  quantity: number
}

type CheckoutBody = {
  items?: CheckoutItem[]
}

/* -------------------------------------------------------------------------- */
/*  Stripe client (lazy — keeps cold-start and import paths cheap)             */
/* -------------------------------------------------------------------------- */

let stripeClient: Stripe | null = null
function getStripe(): Stripe {
  if (stripeClient) return stripeClient
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured.')
  }
  stripeClient = new Stripe(key, {
    // Pinned to the version aligned with the project's Stripe dashboard.
    // The SDK's strict literal type (`LatestApiVersion`) is bumped on
    // every release, so we widen via `unknown` — at runtime any version
    // string is accepted by the SDK.
    apiVersion:
      '2025-04-30.basil' as unknown as ConstructorParameters<
        typeof Stripe
      >[1] extends infer C
        ? C extends { apiVersion?: infer V }
          ? V
          : never
        : never,
  })
  return stripeClient
}

/* -------------------------------------------------------------------------- */
/*  Body validation                                                            */
/* -------------------------------------------------------------------------- */

function parseItems(raw: unknown): CheckoutItem[] | null {
  if (!Array.isArray(raw)) return null

  const items: CheckoutItem[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') return null
    const e = entry as Record<string, unknown>
    if (typeof e.product_id !== 'string' || e.product_id.trim() === '') {
      return null
    }
    if (
      typeof e.quantity !== 'number' ||
      !Number.isInteger(e.quantity) ||
      e.quantity < 1
    ) {
      return null
    }
    items.push({ product_id: e.product_id, quantity: e.quantity })
  }
  return items
}

/* -------------------------------------------------------------------------- */
/*  Route handler                                                              */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
  // ---- Auth ----
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Bejelentkezés szükséges.' },
      { status: 401 },
    )
  }

  // ---- Body ----
  let body: CheckoutBody
  try {
    body = (await request.json()) as CheckoutBody
  } catch {
    return NextResponse.json(
      { error: 'Érvénytelen kérés.' },
      { status: 400 },
    )
  }

  const items = parseItems(body.items)
  if (!items) {
    return NextResponse.json(
      { error: 'Érvénytelen kosár tartalom.' },
      { status: 400 },
    )
  }
  if (items.length === 0) {
    return NextResponse.json(
      { error: 'A kosár üres.' },
      { status: 400 },
    )
  }
  if (items.length > MAX_ITEMS) {
    return NextResponse.json(
      { error: `Túl sok tétel (max ${MAX_ITEMS}).` },
      { status: 400 },
    )
  }

  // ---- Load products ----
  const productIds = Array.from(new Set(items.map((i) => i.product_id)))
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, price, is_active')
    .in('id', productIds)
    .eq('is_active', true)

  if (productsError) {
    return NextResponse.json(
      { error: 'A termékek betöltése sikertelen.' },
      { status: 500 },
    )
  }

  if (!products || products.length !== productIds.length) {
    return NextResponse.json(
      { error: 'Érvénytelen termék.' },
      { status: 400 },
    )
  }

  const productById = new Map(products.map((p) => [p.id, p]))

  // ---- Build Stripe line items ----
  // The element type lives on the Sessions resource namespace; we infer
  // it from the SessionCreateParams shape so we do not depend on the
  // `Stripe.Checkout.SessionCreateParams` re-export (which is a type
  // alias and does not expose nested member types).
  type CheckoutLineItem = NonNullable<
    Parameters<Stripe['checkout']['sessions']['create']>[0]
  >['line_items'] extends (infer T)[] | undefined
    ? T
    : never

  const lineItems: CheckoutLineItem[] = items.map((item) => {
    const product = productById.get(item.product_id)!
    return {
      price_data: {
        currency: 'huf',
        product_data: { name: product.name },
        // HUF is a zero-decimal currency in Stripe — pass the price
        // directly as the smallest unit.
        unit_amount: product.price,
      },
      quantity: item.quantity,
    }
  })

  // ---- Create session ----
  const origin = request.headers.get('origin') ?? 'http://localhost:3000'
  const stripe = getStripe()

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop/cancel`,
      metadata: { user_id: user.id },
    })

    if (!session.url) {
      return NextResponse.json(
        { error: 'A fizetési munkamenet létrehozása sikertelen.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ismeretlen hiba'
    return NextResponse.json(
      { error: 'A fizetési munkamenet létrehozása sikertelen.', details: message },
      { status: 500 },
    )
  }
}
