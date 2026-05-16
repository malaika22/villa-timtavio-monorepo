'use client';

import { useMemo, useState } from 'react';

import { AddVendorCard } from '@/components/manager/pages/vendors/AddVendorCard';
import { VendorCard } from '@/components/manager/pages/vendors/VendorCard';
import { VendorsFilterBar } from '@/components/manager/pages/vendors/VendorsFilterBar';
import { vendorProfiles } from '@/lib/vendors-mock-data';
import type { VendorFilterTab, VendorProfile } from '@/types';

function filterVendors(
  items: VendorProfile[],
  tab: VendorFilterTab,
  query: string,
): VendorProfile[] {
  let result = items;
  if (tab !== 'all') {
    result = result.filter((v) => v.category === tab);
  }
  const q = query.trim().toLowerCase();
  if (!q) return result;
  return result.filter(
    (v) =>
      v.name.toLowerCase().includes(q) ||
      v.categoryLabel.toLowerCase().includes(q) ||
      v.lead.toLowerCase().includes(q) ||
      v.serviceTags.some((t) => t.toLowerCase().includes(q)),
  );
}

export const VendorsPage = () => {
  const [activeTab, setActiveTab] = useState<VendorFilterTab>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => filterVendors(vendorProfiles, activeTab, search),
    [activeTab, search],
  );

  return (
    <div className="font-inter space-y-6">
      <VendorsFilterBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        search={search}
        onSearchChange={setSearch}
      />

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((vendor) => (
          <VendorCard key={vendor.id} vendor={vendor} />
        ))}
        <AddVendorCard />
      </div>
    </div>
  );
};
