import { createHash } from 'node:crypto'

/** Keep existing product IDs (order references); new mock products get stable IDs. */
export function productSeedIds(names: string[], existing: { id: string; name: string }[]): Map<string, string> {
  const result = new Map<string, string>()
  for (const row of existing) {
    if (result.has(row.name)) throw new Error(`Duplicate product name: ${row.name}. Resolve duplicates before seeding; no rows were changed.`)
    result.set(row.name, row.id)
  }
  for (const name of names) {
    if (result.has(name)) continue
    const hex = createHash('sha256').update(`fittrack:mock-product:${name}`).digest('hex')
    result.set(name, `${hex.slice(0, 8)}-${hex.slice(8, 12)}-8${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`)
  }
  return result
}
