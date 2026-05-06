/**
 * Product detail page — F9.4
 */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package } from 'lucide-react'

import { getProduct } from '@/lib/shop/queries'
import { Badge } from '@/components/ui/badge'
import { ProductAddToCart } from '@/components/shop/product-add-to-cart'
import { cn } from '@/lib/utils'

interface ProductPageProps {
  params: Promise<{ id: string }>
}

function formatHuf(price: number): string {
  return new Intl.NumberFormat('hu-HU').format(price) + ' Ft'
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) return { title: 'Termék nem található — FitTrack Pro' }
  return {
    title: `${product.name} — FitTrack Pro`,
    description: product.description ?? undefined,
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) notFound()

  return (
    <div className="space-y-8">
      <Link
        href="/shop"
        className={cn(
          'inline-flex items-center gap-2',
          'font-condensed text-sm font-semibold uppercase tracking-display',
          'text-muted-foreground transition-colors hover:text-brand-red',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded',
        )}
      >
        <ArrowLeft className="size-4" strokeWidth={1.5} />
        Vissza a shopba
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl border border-border',
            'bg-gradient-to-br from-[#1a1a1a] to-[#111111]',
            'aspect-square lg:aspect-auto lg:min-h-[480px]',
          )}
        >
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-[360px] w-full items-center justify-center">
              <Package className="size-24 text-brand-gray opacity-30" strokeWidth={1} />
            </div>
          )}
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.04]" />
        </div>

        <div className="flex flex-col gap-6">
          {product.category && (
            <div>
              <Badge className="font-condensed text-xs uppercase tracking-wide-display">{product.category}</Badge>
            </div>
          )}
          <h1 className="font-condensed text-3xl font-extrabold uppercase tracking-display text-foreground sm:text-4xl">
            {product.name}
          </h1>
          {product.description && (
            <p className="leading-relaxed text-muted-foreground">{product.description}</p>
          )}
          <div className={cn('rounded-xl border border-border bg-card px-5 py-4', 'flex items-center justify-between gap-4')}>
            <span className="font-condensed text-sm uppercase tracking-display text-muted-foreground">Ár</span>
            <span className="font-condensed text-3xl font-extrabold tracking-display text-foreground">{formatHuf(product.price)}</span>
          </div>
          {product.stock !== undefined && product.stock !== null && (
            <p className={cn('font-condensed text-xs uppercase tracking-wide-display', product.stock > 0 ? 'text-emerald-500' : 'text-destructive')}>
              {product.stock > 0 ? `Készleten: ${product.stock} db` : 'Elfogyott'}
            </p>
          )}
          <ProductAddToCart product={product} />
        </div>
      </div>
    </div>
  )
}
