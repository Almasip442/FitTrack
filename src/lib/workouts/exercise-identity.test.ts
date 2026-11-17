import assert from 'node:assert/strict'
import test from 'node:test'

import { findDuplicateExerciseIds } from '@/lib/workouts/exercise-identity'

test('finds repeated catalog exercise IDs within a workout day', () => {
  assert.deepEqual(
    [...findDuplicateExerciseIds(['exercise-a', 'exercise-b', 'exercise-a'])],
    ['exercise-a'],
  )
})

test('returns no duplicates when all planned exercises are unique', () => {
  assert.deepEqual(
    [...findDuplicateExerciseIds(['exercise-a', 'exercise-b'])],
    [],
  )
})
