import {
  Dumbbell,
  Flame,
  LayoutDashboard,
  ShoppingBag,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

export type NavRoute = {
  href: string
  label: string
  icon: LucideIcon
}

/**
 * Top-nav routes (desktop) — appear in this order from left to right.
 */
export const desktopRoutes: NavRoute[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/workouts', label: 'Edzés', icon: Dumbbell },
  { href: '/calories', label: 'Kalória', icon: Flame },
  { href: '/progress', label: 'Fejlődés', icon: TrendingUp },
  { href: '/shop', label: 'Shop', icon: ShoppingBag },
]

/**
 * Bottom tab-bar routes (mobile) — order per backlog spec:
 * Dashboard, Edzés, Kalória, Shop, Fejlődés.
 */
export const mobileTabs: NavRoute[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/workouts', label: 'Edzés', icon: Dumbbell },
  { href: '/calories', label: 'Kalória', icon: Flame },
  { href: '/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/progress', label: 'Fejlődés', icon: TrendingUp },
]
