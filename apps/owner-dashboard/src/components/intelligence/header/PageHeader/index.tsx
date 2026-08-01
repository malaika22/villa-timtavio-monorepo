'use client';

import { Button } from '@repo/ui';
import { Calendar, ChevronDown, Download, FileText } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { MobileIntelligenceNav } from '@/components/intelligence/sidebar/MobileIntelligenceNav';
import { GlobalPeriodSelector } from '@/components/intelligence/header/GlobalPeriodSelector';
import type { PageMeta } from '@/config/navigation';

const outlineBtn =
  'font-inter h-9 gap-1.5 rounded-md border border-[#e8e4de] bg-white px-4 text-sm font-medium text-intel-text shadow-none hover:bg-[#faf9f7]';

export const PageHeader = ({ meta }: { meta: PageMeta }) => {
  const pathname = usePathname();
  const isHeatMaps = pathname === '/heat-maps';
  const isAnalytics = pathname === '/analytics';
  const isExperiences = pathname === '/experiences';
  const isVendors = pathname === '/vendors';
  const isCapitalInsights = pathname === '/capital-insights';
  const isSystemHealth = pathname === '/system-health';
  const isOverview = pathname === '/';
  const useYtdExport =
    isHeatMaps ||
    isAnalytics ||
    isExperiences ||
    isVendors ||
    isCapitalInsights;

  // The global period selector drives the activity modules (Overview,
  // Experiences). Revenue/Vendors present YTD figures, heat maps is "today",
  // capital insights is annual, system health has no date control.
  const showPeriodSelector = isOverview || isExperiences;
  const isFixedRange =
    isHeatMaps || isCapitalInsights || isAnalytics || isVendors;
  // Derived, never hardcoded — a frozen date label silently misreports which
  // day the heat map is actually showing.
  const now = new Date();
  const fixedLabel = isHeatMaps
    ? now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : isCapitalInsights
      ? `${now.getFullYear()} Annual`
      : `YTD ${now.getFullYear()}`;

  return (
    <header className="flex shrink-0 flex-col gap-2 border-y border-[#e8e4de] bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
      <div className="flex items-center gap-3">
        <MobileIntelligenceNav />
        <div>
          <h1 className="font-cormorant text-[28px] leading-tight font-normal text-intel-text">
            {meta.title}
          </h1>
          <p className="font-inter mt-0.5 text-sm text-intel-text-muted">
            {meta.subtitle}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {showPeriodSelector ? (
          <GlobalPeriodSelector />
        ) : isFixedRange ? (
          <Button variant="outline" className={outlineBtn}>
            <Calendar className="size-3.5 text-intel-text-muted" />
            {fixedLabel}
            <ChevronDown className="size-3.5 text-intel-text-muted" />
          </Button>
        ) : null}
        <Button
          variant="outline"
          className={outlineBtn}
          onClick={() => {
            if (typeof window !== 'undefined') window.print();
          }}
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
