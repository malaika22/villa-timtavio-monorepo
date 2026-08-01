'use client';

import { useSatisfaction } from '@/hooks/useAnalytics';
import { PerformanceScatter } from '@/components/intelligence/charts/PerformanceScatter';

function scoreColor(score: number): string {
  if (score >= 4.5) return '#2f8f6b'; // teal
  if (score >= 4.0) return '#c08a2d'; // amber
  return '#c0533f'; // coral
}

function interpretation(score: number): string {
  if (score >= 4.8) return 'Exceptional — guests are delighted.';
  if (score >= 4.5) return 'Excellent — consistently strong sentiment.';
  if (score >= 4.0) return 'Good — a few areas to tighten.';
  return 'Needs attention.';
}

export const SatisfactionPage = () => {
  const { data, isLoading } = useSatisfaction();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-xl bg-[#f0ede8]" />
        <div className="h-64 animate-pulse rounded-xl bg-[#f0ede8]" />
      </div>
    );
  }

  if (!data || data.reviewCount === 0) {
    // Keep the score scaffolding visible with em-dashes, the way every other
    // page does. Collapsing to a single line made the page look unfinished
    // rather than simply empty, and hid what it will show once reviews land.
    return (
      <div className="space-y-6">
        <section className="flex flex-wrap items-center gap-6 rounded-xl border border-[#e8e4de] bg-white p-6">
          <div>
            <div className="font-cormorant text-[52px] leading-none text-[#c9c4bd]">
              —
            </div>
            <p className="mt-1 text-xs uppercase tracking-wider text-[#6b6661]">
              Overall score
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[#3a3632]">No guest reviews yet.</p>
            <p className="mt-1 text-sm text-[#6b6661]">
              Scores, sentiment and themes appear here once guests review their
              stay.
            </p>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {['Service', 'Cleanliness', 'Experiences', 'Value'].map((label) => (
            <div
              key={label}
              className="rounded-xl border border-[#e8e4de] bg-white p-4"
            >
              <p className="text-xs uppercase tracking-wider text-[#6b6661]">
                {label}
              </p>
              <p className="mt-2 font-cormorant text-[28px] leading-none text-[#c9c4bd]">
                —
              </p>
            </div>
          ))}
        </section>
      </div>
    );
  }

  const { overall, reviewCount, categories, trend, themes, scatter } = data;
  const maxTrend = Math.max(...trend.map((t) => t.score), 5);
  const scatterPoints = (scatter ?? []).map((p) => ({
    name: p.name,
    x: Math.round(p.revenue),
    y: p.satisfaction,
  }));

  return (
    <div className="space-y-6">
      {/* Score header */}
      <section className="flex flex-wrap items-center gap-6 rounded-xl border border-[#e8e4de] bg-white p-6">
        <div>
          <div className="flex items-end gap-1">
            <span
              className="text-5xl font-semibold"
              style={{ color: scoreColor(overall) }}
            >
              {overall.toFixed(2)}
            </span>
            <span className="mb-1 text-lg text-[#9a9288]">/ 5.0</span>
          </div>
          <p className="mt-1 text-sm text-[#6b6661]">
            {interpretation(overall)} · {reviewCount} review
            {reviewCount === 1 ? '' : 's'}
          </p>
        </div>
        {/* Sentiment sparkline */}
        <div className="ml-auto flex items-end gap-1.5">
          {trend.map((t) => (
            <div key={t.month} className="flex flex-col items-center gap-1">
              <div
                className="w-5 rounded-t"
                style={{
                  height: `${(t.score / maxTrend) * 56}px`,
                  background: scoreColor(t.score),
                }}
                title={`${t.month}: ${t.score}`}
              />
              <span className="text-[9px] text-[#b0aaa0]">
                {t.month.slice(5)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Category breakdown */}
      <section className="rounded-xl border border-[#e8e4de] bg-white p-6">
        <h2 className="mb-4 text-sm font-medium text-[#2b2824]">
          Category breakdown
        </h2>
        <div className="space-y-3">
          {categories.map((c) => (
            <div key={c.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-[#2b2824]">{c.label}</span>
                <span
                  className="font-medium tabular-nums"
                  style={{ color: scoreColor(c.score) }}
                >
                  {c.score.toFixed(2)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#f0ede8]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(c.score / 5) * 100}%`,
                    background: scoreColor(c.score),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Themes */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[#cfe3d8] bg-[#f3f9f5] p-5">
          <h3 className="mb-2 text-sm font-medium text-[#2f8f6b]">
            What guests praise
          </h3>
          {themes.praise.length ? (
            <ul className="space-y-1 text-sm text-[#2b2824]">
              {themes.praise.map((t) => (
                <li key={t}>· {t}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#6b6661]">—</p>
          )}
        </div>
        <div className="rounded-xl border border-[#ecd9c8] bg-[#fcf5ee] p-5">
          <h3 className="mb-2 text-sm font-medium text-[#c08a2d]">
            Where to improve
          </h3>
          {themes.improvement.length ? (
            <ul className="space-y-1 text-sm text-[#2b2824]">
              {themes.improvement.map((t) => (
                <li key={t}>· {t}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#6b6661]">
              Nothing flagged — every category is strong.
            </p>
          )}
        </div>
      </section>

      {/* Satisfaction vs revenue */}
      {scatterPoints.length > 0 ? (
        <section className="rounded-xl border border-[#e8e4de] bg-white p-6">
          <h2 className="mb-1 text-sm font-medium text-[#2b2824]">
            Satisfaction vs revenue
          </h2>
          <p className="mb-3 text-xs text-[#9a9288]">
            Each point is a stay — folio total against its overall score.
          </p>
          <PerformanceScatter
            points={scatterPoints}
            xLabel="Revenue ($)"
            yLabel="Score"
            yRef={4.5}
          />
        </section>
      ) : null}
    </div>
  );
};
