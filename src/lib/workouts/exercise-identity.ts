/** Return IDs that occur more than once in a single planned workout day. */
export function findDuplicateExerciseIds(exerciseIds: readonly string[]): Set<string> {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  for (const exerciseId of exerciseIds) {
    if (seen.has(exerciseId)) duplicates.add(exerciseId)
    else seen.add(exerciseId)
  }

  return duplicates
}
