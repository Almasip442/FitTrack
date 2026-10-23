import assert from 'node:assert/strict'
import test from 'node:test'

import { generateRuleBasedSummary } from '@/lib/analysis/rule-summary'
import type { WeeklyMetricSnapshot } from '@/lib/analysis/weekly-metrics'

const emptyMetrics: WeeklyMetricSnapshot = {
  weekStart: '2026-10-12', weekEnd: '2026-10-18', goal: 'maintain',
  calorieTarget: 2200, proteinTarget: 165, elapsedDays: 7,
  nutritionDays: 0, proteinDays: 0, averageCalories: null,
  averageProtein: null, calorieDifference: null,
  plannedWorkouts: 4, completedWorkouts: 2, workoutCompletionPercent: 50,
  exerciseCount: 0, totalSets: 0, totalReps: 0, volumeKg: 0,
  weightMeasurements: 0, averageWeight: null, previousAverageWeight: null,
  weightChange: null,
}

test('rule summary is deterministic and flags missing logs without treating them as zero', () => {
  const first = generateRuleBasedSummary(emptyMetrics)
  const second = generateRuleBasedSummary(emptyMetrics)
  assert.deepEqual(first, second)
  assert.equal(first.suggestions.length, 3)
  assert.match(first.summary, /nem került rögzítésre|nem került rögzítésre/i)
  assert.match(first.riskWarning, /nem egészségügyi tanács/i)
  assert.ok(first.rating >= 1 && first.rating <= 10)
})

test('two consecutive under-target weeks produce a manual lighter-plan suggestion', () => {
  const recent = { ...emptyMetrics, completedWorkouts: 3, workoutCompletionPercent: 75, volumeKg: 14_400 }
  const earlier = { ...emptyMetrics, completedWorkouts: 2, workoutCompletionPercent: 50, volumeKg: 9_000 }

  const result = generateRuleBasedSummary(emptyMetrics, recent, earlier)
  const adaptation = result.suggestions.find((suggestion) => suggestion.includes('előző két lezárt héten'))

  assert.ok(adaptation)
  assert.match(adaptation, /3\/4.*2\/4/)
  assert.match(adaptation, /alacsonyabb heti gyakoriság/)
  assert.match(adaptation, /nem módosítja automatikusan/)
})

test('two fully completed weeks suggest only a small manual progression', () => {
  const recent = { ...emptyMetrics, completedWorkouts: 4, workoutCompletionPercent: 100, volumeKg: 14_400 }
  const earlier = { ...emptyMetrics, completedWorkouts: 4, workoutCompletionPercent: 100, volumeKg: 9_000 }

  const result = generateRuleBasedSummary(emptyMetrics, recent, earlier)
  const adaptation = result.suggestions.find((suggestion) => suggestion.includes('előző két lezárt héten'))

  assert.ok(adaptation)
  assert.match(adaptation, /egyetlen tényezőt változtass kis lépésben/)
  assert.match(adaptation, /nem módosítja automatikusan/)
})

test('one completed week alone is not enough to trigger an adaptive suggestion', () => {
  const recent = { ...emptyMetrics, completedWorkouts: 4, workoutCompletionPercent: 100, volumeKg: 14_400 }
  const result = generateRuleBasedSummary(emptyMetrics, recent)

  assert.equal(
    result.suggestions.some((suggestion) => suggestion.includes('előző két lezárt héten')),
    false,
  )
})
