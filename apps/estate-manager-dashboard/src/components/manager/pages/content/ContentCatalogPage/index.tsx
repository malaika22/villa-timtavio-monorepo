'use client';

import { useMemo, useState } from 'react';

import { AddExperienceCard } from '@/components/manager/pages/content/AddExperienceCard';
import { ContentCatalogTabs } from '@/components/manager/pages/content/ContentCatalogTabs';
import { ContentCatalogToolbar } from '@/components/manager/pages/content/ContentCatalogToolbar';
import { ContentInfoBanner } from '@/components/manager/pages/content/ContentInfoBanner';
import { ExperienceCard } from '@/components/manager/pages/content/ExperienceCard';
import { contentExperiences } from '@/lib/content-catalog-mock-data';
import type { ContentCatalogTab, ContentExperienceCategory } from '@/types';

type FilterValue = 'all' | ContentExperienceCategory;

function filterExperiences(
  items: typeof contentExperiences,
  filter: FilterValue,
  query: string,
) {
  let result = items;
  if (filter !== 'all') {
    result = result.filter((e) => e.category === filter);
  }
  const q = query.trim().toLowerCase();
  if (!q) return result;
  return result.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.categoryLabel.toLowerCase().includes(q) ||
      e.pricing.includes(q),
  );
}

export const ContentCatalogPage = () => {
  const [activeTab, setActiveTab] = useState<ContentCatalogTab>('experiences');
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => filterExperiences(contentExperiences, activeFilter, search),
    [activeFilter, search],
  );

  const activeCount = contentExperiences.filter((e) => e.active).length;

  return (
    <div className="font-inter space-y-6">
      <ContentCatalogTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'experiences' ? (
        <div className="space-y-6">
          <ContentInfoBanner />

          <ContentCatalogToolbar
            search={search}
            onSearchChange={setSearch}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            summary={`${contentExperiences.length} experiences · ${activeCount} active`}
          />

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((experience) => (
              <ExperienceCard key={experience.id} experience={experience} />
            ))}
            <AddExperienceCard />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[#e8e4de] bg-white px-6 py-16 text-center shadow-[0_1px_3px_rgba(26,22,20,0.04)]">
          <p className="font-cormorant text-2xl text-manager-text">
            {activeTab === 'menus' ? 'Menus' : 'Recommendations'}
          </p>
          <p className="font-inter mt-2 text-sm text-manager-text-muted">
            Switch to Experiences to view the catalog grid.
          </p>
        </div>
      )}
    </div>
  );
};
