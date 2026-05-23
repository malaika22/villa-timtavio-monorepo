'use client';

import { cn } from '@repo/ui/lib/utils';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';

import {
  FOLIO_CATEGORY_CONFIG,
  FOLIO_MOCK,
  FOLIO_TABS,
  type FolioItem,
  type FolioTabId,
} from '../mockData';

const fmtAmount = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);

export const FolioLineItems = () => {
  const [activeTab, setActiveTab] = useState<FolioTabId>('all');
  const { items, totals } = FOLIO_MOCK;

  const tax = totals.subtotal * totals.taxRate;
  const grandTotal = totals.subtotal + tax;

  return (
    <div className="flex flex-col bg-[#F5F0E8]">
      {/* Tab bar */}
      <div className="bg-white border-b border-[#E3E0DA] flex">
        {FOLIO_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 py-3.5 text-[9px] font-semibold uppercase tracking-[1.8px] transition-colors relative',
              activeTab === tab.id
                ? 'text-[#1A1A18]'
                : 'text-[#B0AAA0] hover:text-[#797168]',
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-[#1A1A18]" />
            )}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="px-4 pt-4 pb-2 flex flex-col gap-3">
        {activeTab === 'all' && <FlatList items={items} />}
        {activeTab === 'by-type' && <ByTypeList items={items} />}
        {activeTab === 'by-day' && <ByDayList items={items} />}
      </div>

      {/* Summary */}
      <div className="mx-4 mt-2 mb-6 border-t border-[#E3E0DA] pt-4 flex flex-col gap-2.5">
        <SummaryRow label="Subtotal" value={fmtAmount(totals.subtotal)} />
        <SummaryRow label={totals.taxLabel} value={fmtAmount(tax)} />
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[14px] font-semibold text-[#1A1A18]">
            Grand Total
          </span>
          <span className="text-[14px] font-semibold text-[#1A1A18]">
            {fmtAmount(grandTotal)}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ─── Flat list (ALL tab) ─── */
function FlatList({ items }: { items: FolioItem[] }) {
  return (
    <>
      {items.map((item) => (
        <LineItemCard key={item.id} item={item} />
      ))}
    </>
  );
}

/* ─── Grouped by category (BY TYPE tab) ─── */
function ByTypeList({ items }: { items: FolioItem[] }) {
  const order: FolioItem['category'][] = ['villa', 'experience', 'incidental'];
  return (
    <>
      {order.map((cat) => {
        const group = items.filter((i) => i.category === cat);
        if (!group.length) return null;
        const config = FOLIO_CATEGORY_CONFIG[cat];
        return (
          <div key={cat}>
            <p className="mb-2 text-[8px] font-semibold uppercase tracking-[2px] text-[#9A9288]">
              {config.label}
            </p>
            <div className="flex flex-col gap-3">
              {group.map((item) => (
                <LineItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

/* ─── Grouped by date (BY DAY tab) ─── */
function ByDayList({ items }: { items: FolioItem[] }) {
  const dates = [...new Set(items.map((i) => i.date))];
  return (
    <>
      {dates.map((date) => {
        const group = items.filter((i) => i.date === date);
        return (
          <div key={date}>
            <p className="mb-2 text-[8px] font-semibold uppercase tracking-[2px] text-[#9A9288]">
              {date}
            </p>
            <div className="flex flex-col gap-3">
              {group.map((item) => (
                <LineItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

/* ─── Single line-item card ─── */
function LineItemCard({ item }: { item: FolioItem }) {
  const config = FOLIO_CATEGORY_CONFIG[item.category];

  return (
    <div className="rounded-[12px] border border-[#E3E0DA] bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(15,31,46,0.04)]">
      {/* Top row: chip + title + amount */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Category chip */}
          <span
            className={cn(
              'shrink-0 rounded-full border px-2 py-[3px] text-[7.5px] font-semibold uppercase tracking-[1px]',
              config.chip,
            )}
          >
            <span className="inline-flex items-center gap-1">
              {config.dot && (
                <span
                  className={cn('size-[4px] rounded-full shrink-0', config.dot)}
                  aria-hidden
                />
              )}
              {config.label}
            </span>
          </span>
          <span className="text-[14px] font-medium text-[#1A1A18] leading-tight truncate">
            {item.title}
          </span>
        </div>
        <span className="text-[14px] font-medium text-[#1A1A18] shrink-0">
          {fmtAmount(item.amount)}
        </span>
      </div>

      {/* Meta line */}
      <p className="mt-1 text-[9px] font-medium uppercase tracking-[1.2px] text-[#9A9288]">
        {item.meta}
      </p>

      {/* Description */}
      {item.description && (
        <p className="mt-2 text-[11px] leading-snug text-[#5C534A]">
          {item.description}
        </p>
      )}

      {/* Staff note */}
      {item.staffNote && (
        <p className="mt-1 font-cormorant text-[12px] italic leading-snug text-[#9A9288]">
          Staff note: {item.staffNote}
        </p>
      )}

      {/* View status link */}
      {item.showViewStatus && (
        <button
          type="button"
          className="mt-2.5 flex items-center gap-1 text-[10px] font-semibold text-[#3A5E48] transition-opacity hover:opacity-70"
        >
          View status
          <ArrowRight size={10} aria-hidden />
        </button>
      )}
    </div>
  );
}

/* ─── Summary row ─── */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-[#797168]">{label}</span>
      <span className="text-[12px] text-[#797168]">{value}</span>
    </div>
  );
}
