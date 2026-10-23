import assert from 'node:assert/strict'
import test from 'node:test'

import { isHungarianAnalysisText } from '@/lib/analysis/language-validation'

test('accepts natural Hungarian with accents', () => {
  assert.equal(
    isHungarianAnalysisText([
      'Az elmúlt héten nem teljesült az edzésterv, és kevés adat szerepel a naplóban.',
      'A következő héten rögzíts több edzést és étkezést.',
    ]),
    true,
  )
})

test('rejects mixed Hungarian and Cyrillic output', () => {
  assert.equal(
    isHungarianAnalysisText([
      'Az elmúlt héten не удалось végrehajtani egyetlen edzést sem.',
      'A naplóban kevés adat szerepel.',
    ]),
    false,
  )
})

test('rejects mixed Hungarian, Spanish, and French output', () => {
  assert.equal(
    isHungarianAnalysisText([
      'Az elmúlt héten tampoco sikerült edzeni, a progrès pedig nem mérhető.',
      'A következő héten rögzíts több adatot.',
    ]),
    false,
  )
})

test('rejects a response without Hungarian language cues', () => {
  assert.equal(
    isHungarianAnalysisText([
      'No training was completed this week, and progress is difficult to measure.',
      'Try to record more meals next week.',
    ]),
    false,
  )
})
