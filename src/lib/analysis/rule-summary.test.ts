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
