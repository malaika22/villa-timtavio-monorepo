'use client';

import { useState } from 'react';

import { STATUS_MOCK_DATA } from './mockData';
import { RequestDetailView } from './RequestDetailView';
import { RequestSection } from './RequestSection';
import { StatusSectionLabel } from './StatusSectionLabel';
import { StatusTabFilter } from './StatusTabFilter';
import { StatusTabId } from './type';

export const Status = () => {
  const [activeTab, setActiveTab] = useState<StatusTabId>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const visibleRequests = STATUS_MOCK_DATA.filter((r) =>
    r.tabs.includes(activeTab),
  );

  const activeCount = STATUS_MOCK_DATA.filter((r) =>
    r.tabs.includes('active'),
  ).length;

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Active requests banner */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-[#1A1A18] px-3 py-1.5">
            <span className="size-[5px] rounded-full bg-[#4CAF50]" aria-hidden />
            <span className="text-[9px] font-semibold uppercase tracking-[1.4px] text-white">
              {activeCount} Active Requests
            </span>
          </div>
          <p className="truncate text-[9px] uppercase tracking-[1.4px] text-[#9A9288]">
            We&apos;ll notify you when ready.
          </p>
        </div>

        <StatusTabFilter activeTab={activeTab} setActiveTab={setActiveTab} />
        <StatusSectionLabel activeTab={activeTab} />

        <RequestSection
          visibleRequests={visibleRequests}
          onSelect={setSelectedId}
        />
      </div>

      <RequestDetailView
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
        id={selectedId}
      />
    </>
  );
};
