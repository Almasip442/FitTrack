import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { WeeklySummaryCard } from '@/components/progress/weekly-summary-card'
import type { WeeklyMetricSnapshot } from '@/lib/analysis/weekly-metrics'

function snapshot(overrides: Partial<WeeklyMetricSnapshot>): WeeklyMetricSnapshot {
  return {
    weekStart: '2026-10-05',
    weekEnd: '2026-10-11',
    goal: 'maintain',
    calorieTarget: 2200,
    proteinTarget: 165,
    elapsedDays: 7,
    nutritionDays: 4,
    proteinDays: 4,
    averageCalories: 2000,
    averageProtein: 120,
    calorieDifference: -200,
    plannedWorkouts: 4,
    completedWorkouts: 2,
    workoutCompletionPercent: 50,
    exerciseCount: 8,
    totalSets: 24,
    totalReps: 240,
    volumeKg: 9000,
    weightMeasurements: 3,
    averageWeight: 82.2,
    previousAverageWeight: 82.5,
    weightChange: -0.3,
    ...overrides,
  }
}

test('renders three distinct weekly panels and labels an in-progress week as partial', () => {
  const html = renderToStaticMarkup(createElement(WeeklySummaryCard, {
    current: snapshot({
      weekStart: '2026-10-19',
      weekEnd: '2026-10-21',
      elapsedDays: 3,
      plannedWorkouts: 3,
      completedWorkouts: 2,
      workoutCompletionPercent: 67,
      nutritionDays: 2,
      averageCalories: 2150,
      volumeKg: 7200,
      averageWeight: 81.7,
    }),
    previous: snapshot({
      weekStart: '2026-10-12',
      weekEnd: '2026-10-18',
      completedWorkouts: 3,
      volumeKg: 14_400,
      nutritionDays: 6,
      averageCalories: 2150,
      averageWeight: 81.7,
    }),
    previousPrevious: snapshot({
      weekStart: '2026-10-05',
      weekEnd: '2026-10-11',
      completedWorkouts: 2,
      volumeKg: 9000,
      nutritionDays: 4,
      averageCalories: 2000,
      averageWeight: 82.2,
    }),
  }))

  assert.equal((html.match(/aria-label="Heti áttekintés:/g) ?? []).length, 3)
  assert.match(html, /Kiválasztott hét/)
  assert.match(html, /Előző hét/)
  assert.match(html, /Két héttel korábbi/)
  assert.match(html, /Folyamatban · részleges hét/)
  assert.equal((html.match(/Lezárt hét/g) ?? []).length, 2)
  assert.match(html, /2\/3/)
  assert.match(html, /3\/4/)
  assert.match(html, /2\/4/)
  assert.match(html, /7[\s\u00a0\u202f]?200 kg volumen/)
  assert.match(html, /14[\s\u00a0\u202f]?400 kg volumen/)
  assert.match(html, /9[\s\u00a0\u202f]?000 kg volumen/)
  assert.match(html, /2\/3 nap/)
  assert.match(html, /2[\s\u00a0\u202f]?150 kcal\/nap/)
  assert.match(html, /81\.7 kg/)
  assert.match(html, /82\.2 kg/)
})
