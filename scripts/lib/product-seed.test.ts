import assert from 'node:assert/strict'
import test from 'node:test'
import { productSeedIds } from './product-seed'

test('new catalog IDs are stable across ordering and reruns', () => {
  const first = productSeedIds(['A', 'B'], [])
  const second = productSeedIds(['B', 'A'], [])
  assert.equal(first.get('A'), second.get('A'))
  assert.notEqual(first.get('A'), first.get('B'))
  assert.match(first.get('A')!, /^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/)
})
test('existing catalog IDs remain unchanged for order references', () => {
  assert.equal(productSeedIds(['A'], [{ name: 'A', id: 'existing-id' }]).get('A'), 'existing-id')
})
test('ambiguous existing names fail before any write', () => {
  assert.throws(() => productSeedIds(['A'], [{ name: 'A', id: '1' }, { name: 'A', id: '2' }]), /Duplicate product name/)
})
