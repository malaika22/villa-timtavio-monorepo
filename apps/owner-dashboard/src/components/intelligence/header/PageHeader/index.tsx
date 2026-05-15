'use client';

import { Button } from '@repo/ui';
import { Calendar, ChevronDown, Download, FileText } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { MobileIntelligenceNav } from '@/components/intelligence/sidebar/MobileIntelligenceNav';
import type { PageMeta } from '@/config/navigation';

export const PageHeader = ({ meta }: { meta: PageMeta }) => {
  const pathname = usePathname();
  const isHeatMaps = pathname === '/heat-maps';
  const isAnalytics = pathname === '/analytics';
  const isExperiences = pathname === '/experiences';
  const isVendors = pathname === '/vendors';
  const isCapitalInsights = pathname === '/capital-insights';
  const isSystemHealth = pathname === '/system-health';
  const useYtdExport =
    isHeatMaps || isAnalytics || isExperiences || isVendors || isCapitalInsights;

  const dateLabel = isHeatMaps
    ? 'Mar 27, 2026'
    : isCapitalInsights
      ? '2026 Annual'
      : useYtdExport
        ? 'YTD 2026'
        : 'Mar 2026';

  return (
    <header className="flex flex-col gap-4 border-b border-intel-border bg-intel-main px-4 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-6 lg:py-6">
      <div className="flex items-start gap-3">
        <MobileIntelligenceNav />
        <div>
          <h1 className="font-cormorant text-[32px] leading-tight font-normal text-intel-text">
            {meta.title}
          </h1>
          <p className="mt-1 text-sm text-intel-text-muted">{meta.subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!isSystemHealth ? (
          <Button
            variant="outline"
            className="h-9 gap-1.5 rounded-md border-intel-border bg-intel-card px-3 text-sm font-normal text-intel-text shadow-none hover:bg-white"
          >
            <Calendar className="size-3.5 text-intel-text-muted" />
            {dateLabel}
            <ChevronDown className="size-3.5 text-intel-text-muted" />
          </Button>
        ) : null}
        <Button
          variant="outline"
          className="h-9 gap-1.5 rounded-md border-intel-border bg-intel-card px-4 text-sm font-normal text-intel-text shadow-none hover:bg-white"
        >
          {isSystemHealth ? (
            <>
              <Download className="size-3.5 text-intel-text-muted" />
              Incident Report
            </>
          ) : useYtdExport ? (
            <>
              <Download className="size-3.5 text-intel-text-muted" />
              Export
            </>
          ) : (
            <>
              <FileText className="size-3.5 text-intel-text-muted" />
              Report
            </>
          )}
        </Button>
      </div>
    </header>
  );
};
