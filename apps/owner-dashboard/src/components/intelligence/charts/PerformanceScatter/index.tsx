'use client';

import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  ReferenceLine,
} from 'recharts';

export type ScatterPoint = {
  name: string;
  x: number;
  y: number;
  z?: number;
};

/**
 * Reusable quadrant scatter (e.g. vendor bookings × rating, satisfaction ×
 * revenue). The reference lines split the plot into four quadrants.
 */
export const PerformanceScatter = ({
  points,
  xLabel,
  yLabel,
  xRef,
  yRef,
}: {
  points: ScatterPoint[];
  xLabel: string;
  yLabel: string;
  xRef?: number;
  yRef?: number;
}) => {
  const xMid =
    xRef ??
    (points.length
      ? points.reduce((s, p) => s + p.x, 0) / points.length
      : 0);
  const yMid =
    yRef ??
    (points.length
      ? points.reduce((s, p) => s + p.y, 0) / points.length
      : 0);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart margin={{ top: 16, right: 20, bottom: 28, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--intel-border)" />
        <XAxis
          type="number"
          dataKey="x"
          name={xLabel}
          tick={{ fontSize: 11, fill: 'var(--intel-text-muted)' }}
          label={{ value: xLabel, position: 'bottom', fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={yLabel}
          tick={{ fontSize: 11, fill: 'var(--intel-text-muted)' }}
          label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11 }}
        />
        <ZAxis type="number" dataKey="z" range={[60, 400]} />
        {xMid ? <ReferenceLine x={xMid} stroke="var(--intel-border)" /> : null}
        {yMid ? <ReferenceLine y={yMid} stroke="var(--intel-border)" /> : null}
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as ScatterPoint;
            return (
              <div className="rounded-md border border-intel-border bg-white px-3 py-2 text-xs shadow-sm">
                <p className="font-medium text-intel-text">{p.name}</p>
                <p className="text-intel-text-muted">
                  {xLabel}: {p.x}
                </p>
                <p className="text-intel-text-muted">
                  {yLabel}: {p.y}
                </p>
              </div>
            );
          }}
        />
        <Scatter data={points} fill="var(--intel-maroon)" fillOpacity={0.75} />
      </ScatterChart>
    </ResponsiveContainer>
  );
};
