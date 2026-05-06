import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

import type { Database } from '@/types/database'

// ---------------------------------------------------------------------
// POST /api/webhooks/stripe
//
// Stripe webhook handler. On `checkout.session.completed` the order is
// persisted to Supabase:
//   - INSERT into `orders`     (status='paid', total, stripe_session_id)
//   - INSERT into `order_items` (one row per cart line)
//
// Auth model:
//   - The webhook is unauthenticated server-to-server traffic; identity
//     is established by the Stripe signature header. Once verified we
//     write through the Supabase service role client (bypasses RLS),
//     because there is no user session attached to a webhook request.
//
// Body handling:
//   - Stripe verifies the signature against the *raw* request body, so
//     we read it via `request.text()` instead of `request.json()`.
//
// Errors:
//   400  missing/invalid signature, malformed body
//   500  Supabase / Stripe API failure (Stripe will retry)
// ---------------------------------------------------------------------

export const runtime = 'nodejs'
// Webhooks must NEVER be cached — every event must hit the handler.
export const dynamic = 'force-dynamic'

/* -------------------------------------------------------------------------- */
/*  Stripe client + admin client (lazy)                                        */
/* -------------------------------------------------------------------------- */

let stripeClient: Stripe | null = null
function getStripe(): Stripe {
  if (stripeClient) return stripeClient
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured.')
  }
  stripeClient = new Stripe(key, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiVersion: '2026-04-22.dahlia' as any,
  })
  return stripeClient
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'Supabase URL or service role key is not configured for the webhook.',
    )
  }
  return createSupabaseAdmin<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/* -------------------------------------------------------------------------- */
/*  Order persistence                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Persist a completed checkout session as an order + order_items rows.
 *
 * The function is idempotent on `stripe_session_id`: if Stripe re-delivers
 * the same event, the second attempt becomes a no-op rather than creating
 * a duplicate order.
 */
async function persistCompletedSession(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  if (!userId) {
    throw new Error(
      `Checkout session ${session.id} is missing metadata.user_id; cannot attribute order.`,
    )
  }

  const supabase = getSupabaseAdmin()

  // Idempotency: a row may already exist from a prior delivery attempt.
  const { data: existing, error: existingError } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle()

  if (existingError) {
    throw new Error(`Failed to check existing order: ${existingError.message}`)
  }
  if (existing) {
    return
  }

  // ---- Pull line items from Stripe (with expanded product) ----
  const stripe = getStripe()
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
    expand: ['data.price.product'],
  })

  const total = session.amount_total ?? 0

  // ---- Insert orders row ----
  const { data: orderRow, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      status: 'paid',
      total,
      stripe_session_id: session.id,
    })
    .select('id')
    .single()

  if (orderError || !orderRow) {
    throw new Error(
      `Failed to insert order: ${orderError?.message ?? 'unknown error'}`,
    )
  }

  // ---- Resolve product ids by name (Stripe sees inline product_data) ----
  const productNames = Array.from(
    new Set(
      lineItems.data
        .map((li) => extractProductName(li))
        .filter((n): n is string => !!n),
    ),
  )

  const productIdByName = new Map<string, string>()
  if (productNames.length > 0) {
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .in('name', productNames)

    if (productsError) {
      throw new Error(`Failed to resolve products: ${productsError.message}`)
    }
    for (const p of products ?? []) {
      productIdByName.set(p.name, p.id)
    }
  }

  // ---- Build order_items rows ----
  const itemRows = lineItems.data
    .map((li) => {
      const name = extractProductName(li)
      if (!name) return null
      const productId = productIdByName.get(name)
      if (!productId) return null

      return {
        order_id: orderRow.id,
        product_id: productId,
        quantity: li.quantity ?? 1,
        // unit_amount is per-item in the smallest currency unit; HUF is
        // zero-decimal so it equals the HUF price directly.
        unit_price: li.price?.unit_amount ?? 0,
      }
    })
    .filter(
      (row): row is NonNullable<typeof row> => row !== null,
    )

  if (itemRows.length === 0) {
    throw new Error(
      `No resolvable order items for session ${session.id}; orders row was created but is empty.`,
    )
  }

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemRows)

  if (itemsError) {
    throw new Error(`Failed to insert order items: ${itemsError.message}`)
  }
}

/**
 * Extract the displayable product name from a Stripe line item. Stripe
 * exposes the name on `description`, on the inline `price.product` (when
 * created via `product_data`) or on the expanded product object.
 */
function extractProductName(
  li: Stripe.LineItem,
): string | null {
  if (li.description) return li.description

  const product = li.price?.product
  if (typeof product === 'object' && product !== null && 'name' in product) {
    const name = (product as Stripe.Product).name
    if (typeof name === 'string' && name) return name
  }
  return null
}

/* -------------------------------------------------------------------------- */
/*  Route handler                                                              */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook secret is not configured.' },
      { status: 500 },
    )
  }

  const signature = request.headers.get('stripe-signature') ?? ''
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header.' },
      { status: 400 },
    )
  }

  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 },
    )
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      await persistCompletedSession(session)
    }
    // Other event types are acknowledged without action.

    return NextResponse.json({ received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ismeretlen hiba'
    // Returning 500 makes Stripe retry, which is the correct behaviour
    // for transient Supabase failures.
    return NextResponse.json(
      { error: 'Webhook handler failed.', details: message },
      { status: 500 },
    )
  }
}
