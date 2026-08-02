'use client';

import { useState } from 'react';

import { RequestDetailView } from './RequestDetailView';
import { RequestSection } from './RequestSection';
import { StatusSectionLabel } from './StatusSectionLabel';
import { StatusTabFilter } from './StatusTabFilter';
import { PlanSummary } from './PlanSummary';
import { StatusTabId } from './type';
import { useBookingRequests } from '@/hooks/useRequests';
import { mapRequestToStatusRequest } from '@/lib/mappers/request';
import type { StatusRequest } from './mockData';

export const Status = () => {
  // Status is the live tracker for the whole stay — open on ALL by default so
  // the guest sees everything (active + upcoming), not just what's in progress.
  const [activeTab, setActiveTab] = useState<StatusTabId>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: apiRequests, isLoading } = useBookingRequests();

  const requests: StatusRequest[] = (apiRequests ?? []).map(
    (r) => mapRequestToStatusRequest(r) as unknown as StatusRequest,
  );

  const visibleRequests = requests.filter((r) => r.tabs.includes(activeTab));

  const activeCount = requests.filter((r) => r.tabs.includes('active')).length;

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-cormorant text-[22px] italic text-[#2B2824]">
            Live Status
          </h1>
          <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#1A1A18] px-3 py-1.5">
            <span
              className="size-[5px] rounded-full bg-[#4CAF50]"
              aria-hidden
            />
            <span className="text-[9px] font-semibold uppercase tracking-[1.4px] text-white">
              {activeCount} Active{' '}
              {activeCount === 1 ? 'Request' : 'Requests'}
            </span>
          </div>
        </div>
        <p className="-mt-1 text-[9px] uppercase tracking-[1.4px] text-[#9A9288]">
          Tracking every experience for your stay — we&apos;ll notify you when
          ready.
        </p>

        {/* What the stay is shaping up to cost, above the list it comes from.
            Pre-arrival this is the number the guest is actually deciding on. */}
        <PlanSummary requests={apiRequests ?? []} />

        <StatusTabFilter activeTab={activeTab} setActiveTab={setActiveTab} />
        <StatusSectionLabel activeTab={activeTab} />

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-[12px] bg-[#E3E0DA]"
              />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[#D8D3C9] bg-[#F7F5F2] px-6 py-12 text-center">
            <p className="font-cormorant text-[18px] italic text-[#2B2824]">
              Nothing in progress
            </p>
            <p className="mt-1 text-[11px] text-[#797168]">
              Experiences requested for your stay will be tracked here.
            </p>
          </div>
        ) : (
          <RequestSection
            visibleRequests={visibleRequests}
            onSelect={setSelectedId}
          />
        )}
      </div>

      <RequestDetailView
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
        id={selectedId}
      />
    </>
  );
};
