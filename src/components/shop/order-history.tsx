/**
 * OrderHistory — F9.10
 *
 * Displays a list of the user's past orders.
 * Intended to be embedded in the shop page or profile page.
 * Data is fetched server-side and passed as props.
 */

import { ShoppingBag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Order } from '@/types/database'

interface OrderHistoryProps {
  orders: Order[]
}

function formatHuf(price: number): string {
  return new Intl.NumberFormat('hu-HU').format(price) + ' Ft'
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Függőben',
  paid: 'Fizetve',
  cancelled: 'Törölve',
}

const STATUS_VARIANT: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'secondary',
  paid: 'default',
  cancelled: 'destructive',
}

export function OrderHistory({ orders }: OrderHistoryProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="rounded-full border border-border bg-card p-5">
          <ShoppingBag
            className="size-10 text-muted-foreground/40"
            strokeWidth={1.5}
          />
        </div>
        <div className="space-y-1">
          <p className="font-condensed text-lg font-bold uppercase tracking-display text-foreground">
            Még nincs rendelésed
          </p>
          <p className="text-sm text-muted-foreground">
            A leadott rendelések itt fognak megjelenni.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className={cn(
            'rounded-xl border border-border bg-card p-4',
            'transition-colors duration-200 hover:border-[rgba(120,0,0,0.35)]',
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-condensed text-base font-bold uppercase tracking-display text-foreground">
                  Rendelés
                </span>
                <span className="font-condensed text-xs uppercase tracking-wide-display text-muted-foreground">
                  #{order.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(order.created_at)}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <Badge
                variant={STATUS_VARIANT[order.status] ?? 'outline'}
                className="font-condensed text-[10px] uppercase tracking-wide-display"
              >
                {STATUS_LABELS[order.status] ?? order.status}
              </Badge>
              <span className="font-condensed text-base font-bold tracking-display text-foreground">
                {formatHuf(order.total)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
