'use client';

import { useState } from 'react';

import { RequestDetailView } from '@/components/Status/RequestDetailView';
import { RequestSection } from '@/components/Status/RequestSection';
import { StatusSectionLabel } from '@/components/Status/StatusSectionLabel';
import { StatusTabFilter } from '@/components/Status/StatusTabFilter';
import type { StatusTabId } from '@/components/Status/type';
import type { StatusRequest } from '@/components/Status/mockData';
import { useBookingRequests } from '@/hooks/useRequests';
import { useAuth } from '@/hooks/useAuth';
import { mapRequestToStatusRequest } from '@/lib/mappers/request';

/**
 * Secondary-guest "My Orders" — the same request list as the Status tracker
 * but scoped to the signed-in guest's own requests. No pricing is rendered
 * anywhere (the Status cards/detail never show cost).
 */
export const MyOrders = () => {
  const [activeTab, setActiveTab] = useState<StatusTabId>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { email } = useAuth();
  const { data: apiRequests, isLoading } = useBookingRequests();

  const mine = (apiRequests ?? []).filter(
    (r) =>
      !email || r.requestedByEmail?.toLowerCase() === email.toLowerCase(),
  );

  const requests: StatusRequest[] = mine.map(
    (r) => mapRequestToStatusRequest(r) as unknown as StatusRequest,
  );

  const visibleRequests = requests.filter((r) => r.tabs.includes(activeTab));
  const activeCount = requests.filter((r) => r.tabs.includes('active')).length;

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="font-cormorant text-[22px] italic text-[#2B2824]">
            My Orders
          </h1>
          <div className="flex items-center gap-1.5 rounded-full bg-[#1A1A18] px-3 py-1.5">
            <span className="size-[5px] rounded-full bg-[#4CAF50]" aria-hidden />
            <span className="text-[9px] font-semibold uppercase tracking-[1.4px] text-white">
              {activeCount} Active
            </span>
          </div>
        </div>

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
              No orders yet
            </p>
            <p className="mt-1 text-[11px] text-[#797168]">
              Experiences you request will appear here.
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
