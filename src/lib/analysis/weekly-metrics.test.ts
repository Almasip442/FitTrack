import assert from 'node:assert/strict'
import test from 'node:test'

import { buildWeekSnapshot } from '@/lib/analysis/weekly-metrics'

test('weekly snapshot averages only recorded nutrition days and totals actual workout volume', () => {
  const result = buildWeekSnapshot({
    start: new Date(2026, 9, 5),
    end: new Date(2026, 9, 11),
    profile: null,
    planDays: [{ day_of_week: 1 }, { day_of_week: 4 }, { day_of_week: 6 }, { day_of_week: 0 }],
    dailyLogs: [
      { date: '2026-10-05', workout_completed: true, food_entries: [{ calories: 2000, protein: 120 }] },
      { date: '2026-10-06', workout_completed: false, food_entries: [{ calories: 2000, protein: 100 }] },
      { date: '2026-10-07', workout_completed: false, food_entries: null },
      { date: '2026-10-08', workout_completed: false, food_entries: null },
      { date: '2026-10-09', workout_completed: false, food_entries: null },
      { date: '2026-10-10', workout_completed: false, food_entries: null },
      { date: '2026-10-11', workout_completed: false, food_entries: null },
    ],
    weights: [{ date: '2026-10-05', weight: 80 }, { date: '2026-10-10', weight: 82 }],
    exerciseLogs: [{
      sets_completed: 2,
      reps_completed: [10, 8],
      weight_used: [20, 25],
      daily_logs: { date: '2026-10-05' },
    }],
    previousAverageWeight: 81,
  })

  assert.equal(result.elapsedDays, 7)
  assert.equal(result.nutritionDays, 2)
  assert.equal(result.averageCalories, 2000)
  assert.equal(result.averageProtein, 110)
  assert.equal(result.plannedWorkouts, 4)
  assert.equal(result.completedWorkouts, 1)
  assert.equal(result.totalSets, 2)
  assert.equal(result.totalReps, 18)
  assert.equal(result.volumeKg, 400)
  assert.equal(result.averageWeight, 81)
  assert.equal(result.weightChange, 0)
})

test('a partially elapsed week counts only days through its end date', () => {
  const result = buildWeekSnapshot({
    start: new Date(2026, 9, 19),
    end: new Date(2026, 9, 21),
    profile: null,
    planDays: [],
    dailyLogs: [],
    weights: [],
    exerciseLogs: [],
    previousAverageWeight: null,
  })
  assert.equal(result.elapsedDays, 3)
  assert.equal(result.averageCalories, null)
})

test('five equal calorie days average to the recorded value, not a seven-day zero-filled average', () => {
  const result = buildWeekSnapshot({
    start: new Date(2026, 9, 5),
    end: new Date(2026, 9, 11),
    profile: null,
    planDays: [],
    dailyLogs: Array.from({ length: 7 }, (_, index) => ({
      date: `2026-10-${String(5 + index).padStart(2, '0')}`,
      workout_completed: false,
      food_entries: index < 5 ? [{ calories: 2000, protein: 100 }] : null,
    })),
    weights: [],
    exerciseLogs: [],
    previousAverageWeight: null,
  })
  assert.equal(result.nutritionDays, 5)
  assert.equal(result.averageCalories, 2000)
})
