import { CalendarDays, Dumbbell, Utensils } from 'lucide-react'

import type { WeeklyMetricSnapshot } from '@/lib/analysis/weekly-metrics'

type WeeklySummaryCardProps = {
  current: WeeklyMetricSnapshot
  previous: WeeklyMetricSnapshot
}

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('hu-HU', {
    month: 'short',
    day: 'numeric',
  })
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
      <p className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-condensed text-lg font-bold tabular-nums text-foreground">
        {value}
      </p>
      {note && <p className="mt-0.5 text-[11px] text-muted-foreground">{note}</p>}
    </div>
  )
}

function WeekPanel({
  metrics,
  isCurrent,
  previousVolume,
}: {
  metrics: WeeklyMetricSnapshot
  isCurrent: boolean
  previousVolume: number
}) {
  const volumeChange = metrics.volumeKg - previousVolume
  const calorieNote = metrics.averageCalories == null
    ? 'Nincs naplózott adat'
    : `${metrics.averageCalories.toLocaleString('hu-HU')} kcal/nap${metrics.calorieDifference == null ? '' : ` · ${metrics.calorieDifference > 0 ? '+' : ''}${metrics.calorieDifference} kcal a becsült célhoz képest`}`
  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-card/50 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-condensed text-base font-bold uppercase tracking-display text-foreground">
          {isCurrent ? 'Kiválasztott hét' : 'Előző hét'}
        </h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          {formatDate(metrics.weekStart)} – {formatDate(metrics.weekEnd)}
        </span>
      </div>
      {metrics.goal && (
        <p className="text-xs text-muted-foreground">Cél: {metrics.goal}</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Metric
          label="Edzés"
          value={`${metrics.completedWorkouts}/${metrics.plannedWorkouts}`}
          note={`${metrics.volumeKg.toLocaleString('hu-HU')} kg volumen${isCurrent && previousVolume > 0 ? ` · ${volumeChange > 0 ? '+' : ''}${volumeChange.toLocaleString('hu-HU')} kg az előző héthez képest` : ''}`}
        />
        <Metric
          label="Étkezési napló"
          value={`${metrics.nutritionDays}/${metrics.elapsedDays} nap`}
          note={calorieNote}
        />
        <Metric
          label="Fehérjeátlag"
          value={metrics.averageProtein == null ? 'Nincs adat' : `${metrics.averageProtein} g`}
          note={metrics.proteinTarget == null ? undefined : `Becsült cél: ${metrics.proteinTarget} g/nap`}
        />
        <Metric
          label="Testsúly"
          value={metrics.averageWeight == null ? 'Nincs elég adat' : `${metrics.averageWeight} kg`}
          note={`${metrics.weightMeasurements} mérés${metrics.weightChange == null ? '' : ` · ${metrics.weightChange > 0 ? '+' : ''}${metrics.weightChange} kg az előző heti átlaghoz képest`}`}
        />
      </div>
      {metrics.nutritionDays < metrics.elapsedDays && (
        <p className="flex items-start gap-2 text-xs text-amber-500">
          <CalendarDays className="mt-0.5 size-3.5 shrink-0" />
          A naplózatlan napokat nem számoltuk nulla kalóriának; az átlag csak a rögzített napokból készült.
        </p>
      )}
    </div>
  )
}

export function WeeklySummaryCard({ current, previous }: WeeklySummaryCardProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <WeekPanel metrics={current} isCurrent previousVolume={previous.volumeKg} />
        <WeekPanel metrics={previous} isCurrent={false} previousVolume={previous.volumeKg} />
      </div>
      <div className="space-y-1 text-[11px] text-muted-foreground">
        <p className="flex items-start gap-2">
          <Dumbbell className="mt-0.5 size-3.5 shrink-0" />
          A volumen a naplózott sorozatok ismétlésszám × súly összege; a tervben szereplő, de nem rögzített gyakorlatok nem számítanak bele.
        </p>
        <p className="flex items-start gap-2">
          <Utensils className="mt-0.5 size-3.5 shrink-0" />
          A fehérjeátlag csak a fehérjeadatot tartalmazó napokat veszi figyelembe.
        </p>
      </div>
    </div>
  )
}
