/**
 * /progress — Progress tracking & AI analysis page.
 *
 * Frontend Iteration 8. Loads weight logs, summary, and AI analyses
 * in parallel on the server, then hydrates client components.
 */

import { TrendingUp } from 'lucide-react'

import { AnalysisCta } from '@/components/progress/analysis-cta'
import { AnalysisHistory } from '@/components/progress/analysis-history'
import { WeightChart } from '@/components/progress/weight-chart'
import { WeightInput } from '@/components/progress/weight-input'
import { WeightSummaryCard } from '@/components/progress/weight-summary-card'
import { getLatestAnalysis, getWeeklyAnalyses } from '@/lib/analysis/queries'
import { getLatestWeightLog, getWeightChangeSummary, getWeightLogs } from '@/lib/weight/queries'

export const metadata = {
  title: 'Fejlődés — FitTrack Pro',
  description:
    'Kövesd nyomon a testsúlyváltozást és kapj személyre szabott AI elemzést.',
}

export default async function ProgressPage() {
  // Parallel data loading
  const [weightLogs, latestWeightLog, weightSummary, analyses, latestAnalysis] =
    await Promise.all([
      getWeightLogs(60).catch(() => []),
      getLatestWeightLog().catch(() => null),
      getWeightChangeSummary().catch(() => ({
        currentWeekAvg: null,
        previousWeekAvg: null,
        changeKg: null,
        changePercent: null,
      })),
      getWeeklyAnalyses(12).catch(() => []),
      getLatestAnalysis().catch(() => null),
    ])

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start gap-3">
        <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-red/10">
          <TrendingUp className="size-4 text-brand-red" strokeWidth={1.5} />
        </div>
        <div>
          <span className="block font-condensed text-[11px] uppercase tracking-wide-display text-brand-red">
            {'// fejlődés'}
          </span>
          <h1 className="font-condensed text-3xl font-bold uppercase tracking-display text-foreground leading-none">
            Testsúly & AI elemzés
          </h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            Rögzítsd a testsúlyod és kapj személyre szabott heti elemzést.
          </p>
        </div>
      </div>

      {/* Top row: weight input + summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <WeightInput latestLog={latestWeightLog} />
        <WeightSummaryCard summary={weightSummary} />
      </div>

      {/* Weight trend chart */}
      <WeightChart logs={weightLogs} />

      {/* AI section divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground">
          AI elemzés
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* AI CTA */}
      <AnalysisCta latestAnalysis={latestAnalysis} />

      {/* Analysis history */}
      <AnalysisHistory analyses={analyses} />
    </div>
  )
}
