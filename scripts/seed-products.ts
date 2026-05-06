/**
 * FitTrack Pro — Product Seed Script
 * -----------------------------------------------------------------------------
 * Populates the Supabase `products` table with ~22-24 mock supplement
 * entries spread across all five categories (protein, kreatin, vitamin,
 * aminosav, egyéb). The script is idempotent: it UPSERTs on `name` so
 * running it twice will not create duplicates — existing rows are
 * updated in place.
 *
 * Usage:
 *   npx tsx scripts/seed-products.ts
 *
 * Required environment variables (loaded from .env.local):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY   (bypasses RLS; do NOT expose to clients)
 * -----------------------------------------------------------------------------
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { resolve } from 'path'

import type { Database } from '../src/types/database'

// Load .env.local from the project root (one level above /scripts).
config({ path: resolve(process.cwd(), '.env.local') })

// -----------------------------------------------------------------------------
// Environment validation
// -----------------------------------------------------------------------------

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// -----------------------------------------------------------------------------
// Product catalog
// -----------------------------------------------------------------------------

type ProductCategory =
  | 'protein'
  | 'kreatin'
  | 'vitamin'
  | 'aminosav'
  | 'egyéb'

type ProductSeed = {
  name: string
  description: string
  price: number // HUF, integer
  category: ProductCategory
  stock: number
}

/** Deterministic stock value so re-running the script does not churn rows. */
function stableStock(seed: string, min: number, max: number): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  const range = max - min + 1
  return min + Math.abs(hash) % range
}

const RAW_PRODUCTS: Array<Omit<ProductSeed, 'stock'>> = [
  // ---- Protein (6) ----
  {
    name: 'Whey Protein Concentrate 1kg',
    description:
      'Tejsavófehérje koncentrátum csokoládé ízben. Magas, 75%-os fehérjetartalom és kiváló aminosav profil az izomépítéshez. Edzés után gyorsan felszívódik.',
    price: 12990,
    category: 'protein',
  },
  {
    name: 'Whey Isolate 2kg',
    description:
      'Hidegen szűrt tejsavófehérje izolátum 90%-os fehérjetartalommal. Minimális zsír- és szénhidráttartalom, laktózérzékenyek számára is ajánlott. Vaníliás ízesítés.',
    price: 24990,
    category: 'protein',
  },
  {
    name: 'Casein Protein 900g',
    description:
      'Lassan felszívódó kazein fehérje, ideális lefekvés előtti fogyasztásra. 8 órán át tartó aminosav-utánpótlást biztosít az éjszakai regeneráció során.',
    price: 11490,
    category: 'protein',
  },
  {
    name: 'Plant-Based Protein 750g',
    description:
      'Borsó- és rizsfehérje keverék vegán sportolóknak. Teljes aminosav profil, természetes édesítőszerekkel. Csokoládé-mogyoró ízben.',
    price: 9990,
    category: 'protein',
  },
  {
    name: 'Beef Protein 900g',
    description:
      'Hidrolizált marhahúsfehérje izolátum laktóz- és tejszármazékmentes. Természetes kreatin- és aminosav forrás, könnyen emészthető eper ízben.',
    price: 14990,
    category: 'protein',
  },
  {
    name: 'Whey Protein Mass Gainer 3kg',
    description:
      'Tömegnövelő fehérje-szénhidrát komplex hard gainer sportolóknak. Adagonként 50g fehérje és komplex szénhidrátok az intenzív izomtömeg-növelési fázisokhoz.',
    price: 18990,
    category: 'protein',
  },

  // ---- Kreatin (4) ----
  {
    name: 'Creatine Monohydrate 500g',
    description:
      'Mikronizált kreatin monohidrát, a legtöbbet kutatott teljesítményfokozó kiegészítő. Növeli az erőt és az izomtömeget, gyorsabb regenerációt biztosít.',
    price: 6490,
    category: 'kreatin',
  },
  {
    name: 'Creatine HCL 300g',
    description:
      'Kreatin-hidroklorid forma, jobb vízoldhatósággal és felszívódással. Kisebb adagolás mellett is hatékony, nem okoz puffadást.',
    price: 7990,
    category: 'kreatin',
  },
  {
    name: 'Tri-Creatine Malate 400g',
    description:
      'Három kreatin molekula egy almasav molekulához kötve. Kíméletes a gyomorra, hosszabb hatástartam mint a hagyományos monohidrátnál.',
    price: 8490,
    category: 'kreatin',
  },
  {
    name: 'Kreatin Komplex 400g',
    description:
      'Öt különböző kreatin forma kombinációja: monohidrát, HCL, malát, etilészter és piruvát. Maximális felszívódás és teljesítmény.',
    price: 8990,
    category: 'kreatin',
  },

  // ---- Vitamin (5) ----
  {
    name: 'Multivitamin Sport Pack',
    description:
      'Komplex multivitamin sportolóknak, 23 vitaminnal és ásványi anyaggal. Napi adagolásra, az aktív életmód okozta megnövekedett tápanyagigényhez.',
    price: 5990,
    category: 'vitamin',
  },
  {
    name: 'Vitamin D3+K2 2000IU',
    description:
      'Magas hatóanyagtartalmú D3-vitamin K2-vel kombinálva. Támogatja a csontok egészségét, az immunrendszert és a megfelelő kalciumhasznosulást.',
    price: 4490,
    category: 'vitamin',
  },
  {
    name: 'Omega-3 Fish Oil 90 caps',
    description:
      'Tisztított halolaj kapszula 1000mg EPA és DHA tartalommal adagonként. Támogatja a szív- és érrendszer, valamint az ízületek egészségét.',
    price: 4990,
    category: 'vitamin',
  },
  {
    name: 'Magnézium Komplex 120 caps',
    description:
      'Háromféle magnézium forma (citrát, biszglicinát, malát) kombinációja. Csökkenti az izomgörcsöket, támogatja a regenerációt és az idegrendszer működését.',
    price: 3990,
    category: 'vitamin',
  },
  {
    name: 'Cink+Szelén 60 caps',
    description:
      'Cink és szelén természetes immunerősítő kombináció. Hozzájárul a tesztoszteron szint normál fenntartásához és a hormonháztartás egyensúlyához.',
    price: 3490,
    category: 'vitamin',
  },

  // ---- Aminosav (5) ----
  {
    name: 'BCAA 2:1:1 300g',
    description:
      'Elágazó láncú aminosavak (leucin, izoleucin, valin) 2:1:1 arányban. Csökkenti az izombontást edzés közben, gyorsabb regenerációt biztosít. Citrus ízben.',
    price: 6990,
    category: 'aminosav',
  },
  {
    name: 'EAA Complex 400g',
    description:
      'Kilenc esszenciális aminosav teljes komplexe italpor formájában. Edzés közbeni izomvédelem és építő hatás egyszerre. Mangó-eper ízesítéssel.',
    price: 9490,
    category: 'aminosav',
  },
  {
    name: 'L-Glutamin 500g',
    description:
      'Tiszta L-glutamin por, a szervezet leggyakoribb aminosava. Támogatja az emésztőrendszert, az immunrendszert és gyorsítja az edzés utáni regenerációt.',
    price: 6490,
    category: 'aminosav',
  },
  {
    name: 'L-Carnitine 120 caps',
    description:
      'L-karnitin tartarát kapszula formában. Segít a zsírsavak energiává alakításában, javítja az állóképességet és a zsírégetést edzés közben.',
    price: 7990,
    category: 'aminosav',
  },
  {
    name: 'Beta-Alanin 300g',
    description:
      'Béta-alanin por a kitartás és a teljesítmény növelésére. Növeli az izomban a karnozin szintjét, késlelteti az izomfáradást intenzív edzés során.',
    price: 6990,
    category: 'aminosav',
  },

  // ---- Egyéb (4) ----
  {
    name: 'Pre-Workout Complex 300g',
    description:
      'Edzés előtti teljesítményfokozó komplex koffeinnel, béta-alaninnal, citrullinnal és kreatinnal. Hosszan tartó energia és intenzív pumpa az edzéshez.',
    price: 8490,
    category: 'egyéb',
  },
  {
    name: 'ZMA Formula 90 caps',
    description:
      'Cink-magnézium-aszpartát és B6-vitamin kombinációja. Támogatja az alvásminőséget, a regenerációt és a természetes hormontermelést.',
    price: 5490,
    category: 'egyéb',
  },
  {
    name: 'Kollagén Peptid 400g',
    description:
      'Hidrolizált marha kollagén peptid C-vitaminnal kiegészítve. Támogatja az ízületek, porcok, bőr és haj egészségét. Íz- és illatmentes por.',
    price: 7990,
    category: 'egyéb',
  },
  {
    name: 'Fat Burner Thermo 90 caps',
    description:
      'Termogén zsírégető komplex zöld tea kivonattal, koffeinnel és L-karnitinnel. Fokozza az anyagcserét és a zsírégetést a fogyókúra során.',
    price: 6990,
    category: 'egyéb',
  },
]

const PRICE_BANDS: Record<ProductCategory, { min: number; max: number }> = {
  protein: { min: 8000, max: 25000 },
  kreatin: { min: 4000, max: 9000 },
  vitamin: { min: 3000, max: 8000 },
  aminosav: { min: 5000, max: 12000 },
  egyéb: { min: 4000, max: 11000 },
}

// Defensive validation: catch any catalog edits that drift outside the
// agreed price bands before they reach the database.
for (const p of RAW_PRODUCTS) {
  const band = PRICE_BANDS[p.category]
  if (p.price < band.min || p.price > band.max) {
    throw new Error(
      `Price ${p.price} for "${p.name}" out of band ${band.min}-${band.max} ` +
        `for category "${p.category}".`,
    )
  }
}

const PRODUCTS: ProductSeed[] = RAW_PRODUCTS.map((p) => ({
  ...p,
  stock: stableStock(p.name, 20, 200),
}))

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('Starting FitTrack Pro product seed...')
  console.log(`Upserting ${PRODUCTS.length} products into Supabase...`)

  const rows = PRODUCTS.map((p) => ({
    name: p.name,
    description: p.description,
    price: p.price,
    category: p.category,
    image_url: null,
    stock: p.stock,
    is_active: true,
  }))

  const { data, error } = await supabase
    .from('products')
    .upsert(rows, { onConflict: 'name' })
    .select('id, name, category, price')

  if (error) {
    console.error('Failed to upsert products:', error.message)
    throw error
  }

  console.log(`\nSeed completed: ${data?.length ?? 0} products inserted/updated.`)

  // Per-category summary so the operator can verify the spread.
  const counts = new Map<ProductCategory, number>()
  for (const p of PRODUCTS) {
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1)
  }
  for (const [cat, n] of counts) {
    console.log(`  ${cat}: ${n}`)
  }
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
