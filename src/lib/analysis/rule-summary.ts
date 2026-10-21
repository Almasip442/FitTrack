import type { WeeklyMetricSnapshot } from '@/lib/analysis/weekly-metrics'

export type RuleBasedSummary = {
  summary: string
  suggestions: string[]
  rating: number
  riskWarning: string
}

/** Build an explainable, deterministic weekly assessment from measured data. */
export function generateRuleBasedSummary(
  metrics: WeeklyMetricSnapshot,
): RuleBasedSummary {
  const observations: string[] = []
  const suggestions: string[] = []
  let score = 5

  if (metrics.plannedWorkouts > 0) {
    observations.push(
      `A terv szerinti ${metrics.plannedWorkouts} edzésből ${metrics.completedWorkouts} lett teljesítettként rögzítve (${metrics.workoutCompletionPercent ?? 0}%).`,
    )
    score += Math.round((metrics.workoutCompletionPercent ?? 0) / 25) - 2
    if (metrics.completedWorkouts < metrics.plannedWorkouts) {
      suggestions.push(
        'A következő héten válassz olyan edzésidőpontokat, amelyeket várhatóan tartani tudsz, és rögzítsd az elvégzett gyakorlatokat.',
      )
    } else {
      suggestions.push(
        'Tartsd meg a mostani, követhető edzésritmust; a naplózott terhelés alapján később lehet összehasonlítani a fejlődést.',
      )
    }
  } else {
    observations.push('Erre az időszakra nem találtunk aktív edzéstervet.')
    suggestions.push('Állíts össze heti edzéstervet, hogy a teljesítés összevethető legyen a céllal.')
  }

  if (metrics.nutritionDays > 0) {
    observations.push(
      `Étkezés ${metrics.nutritionDays}/${metrics.elapsedDays} napra van rögzítve; a naplózott napok átlaga ${metrics.averageCalories} kcal${metrics.calorieTarget == null ? '' : `, a becsült cél ${metrics.calorieTarget} kcal`}.`,
    )
    score += Math.min(2, Math.floor((metrics.nutritionDays / metrics.elapsedDays) * 3))
    if (metrics.nutritionDays < metrics.elapsedDays) {
      suggestions.push('A pontosabb heti képhez naplózd az étkezést a még hiányzó napokon is.')
    } else if (
      metrics.calorieDifference !== null &&
      Math.abs(metrics.calorieDifference) > 200
    ) {
      suggestions.push(
        'Figyeld meg a következő héten is a naplózott kalóriaátlagot; a célhoz viszonyított eltérés önmagában becslés, ezért kerüld a hirtelen változtatást.',
      )
    }
  } else {
    observations.push('Étkezési adat nem került rögzítésre, ezért bevitelátlag nem számítható.')
    suggestions.push('Rögzíts legalább néhány teljes napot, mielőtt a táplálkozási trendből következtetést vonnánk le.')
  }

  if (metrics.averageProtein !== null) {
    observations.push(
      `A rögzített fehérjét tartalmazó napok átlaga ${metrics.averageProtein} g/nap${metrics.proteinTarget == null ? '' : ` (becsült cél: ${metrics.proteinTarget} g/nap)`}.`,
    )
    if (
      metrics.proteinTarget !== null &&
      metrics.averageProtein < metrics.proteinTarget - 15
    ) {
      suggestions.push('Ha teljes az étkezési napló, tervezz be fehérjeforrást több étkezéshez.')
    }
  }

  if (metrics.exerciseCount > 0) {
    observations.push(
      `${metrics.exerciseCount} gyakorlat részletes naplója ${metrics.totalSets} szettet, ${metrics.totalReps} ismétlést és ${metrics.volumeKg} kg összesített terhelést tartalmaz.`,
    )
  }

  if (metrics.weightMeasurements >= 2 && metrics.weightChange !== null) {
    observations.push(
      `${metrics.weightMeasurements} mérés alapján a heti átlag ${metrics.averageWeight} kg; az előző hét átlagához képest ${metrics.weightChange > 0 ? '+' : ''}${metrics.weightChange} kg.`,
    )
  } else {
    observations.push('A testsúlytrendhez ezen a héten nincs legalább két mérés.')
    suggestions.push('Ha a testsúlytrend követése a célod, mérj több napon hasonló körülmények között, és a heti átlagot figyeld.')
  }

  if (metrics.nutritionDays < Math.min(4, metrics.elapsedDays)) score--
  if (metrics.weightMeasurements < 2) score--

  const uniqueSuggestions = [...new Set(suggestions)].slice(0, 3)
  while (uniqueSuggestions.length < 2) {
    uniqueSuggestions.push('Folytasd a naplózást, hogy a következő heti összehasonlítás megbízhatóbb legyen.')
  }

  return {
    summary: observations.join(' '),
    suggestions: uniqueSuggestions,
    rating: Math.max(1, Math.min(10, score)),
    riskWarning:
      'Ez az összesítés naplóadatokra épül, nem egészségügyi tanács. Fájdalom, sérülés, tartós rosszullét vagy egészségügyi kérdés esetén kérj segítséget megfelelő szakembertől.',
  }
}
