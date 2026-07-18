import { Info } from 'lucide-react';

export const CapitalInsightsInfoBanner = () => (
  <div className="flex gap-3 rounded-lg border border-intel-info/25 bg-intel-info-bg px-4 py-3.5">
    <Info className="mt-0.5 size-4 shrink-0 text-intel-info" strokeWidth={2} />
    <p className="text-sm leading-relaxed text-intel-info">
      Capital Insights analyzes buy vs. rent decisions based on utilization
      rates, operating costs, and projected guest demand. Recommendations update
      monthly as booking data accumulates.
    </p>
  </div>
);
