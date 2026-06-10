'use client';

import { useMemo, useRef, useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

import { AddExperienceCard } from '@/components/manager/pages/content/AddExperienceCard';
import { ContentCatalogTabs } from '@/components/manager/pages/content/ContentCatalogTabs';
import { ContentCatalogToolbar } from '@/components/manager/pages/content/ContentCatalogToolbar';
import { ContentInfoBanner } from '@/components/manager/pages/content/ContentInfoBanner';
import { ExperienceCard } from '@/components/manager/pages/content/ExperienceCard';
import { contentExperiences } from '@/lib/content-catalog-mock-data';
import type { ContentCatalogTab, ContentExperienceCategory } from '@/types';
import {
  useCatalogAdmin,
  useToggleCatalogItem,
  useImportCatalogCsv,
} from '@/hooks/useCatalogAdmin';
import { mapCatalogItemToContentExperience } from '@/lib/mappers/catalog';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: catalogData, isLoading } = useCatalogAdmin();
  const toggleActive = useToggleCatalogItem();
  const importCsv = useImportCatalogCsv();

  const allExperiences = useMemo(() => {
    if (catalogData) return catalogData.map(mapCatalogItemToContentExperience);
    return contentExperiences;
  }, [catalogData]);

  const filtered = useMemo(
    () => filterExperiences(allExperiences, activeFilter, search),
    [allExperiences, activeFilter, search],
  );

  const activeCount = allExperiences.filter((e) => e.active).length;

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importCsv.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="font-inter space-y-6">
      <ContentCatalogTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'experiences' ? (
        <div className="space-y-6">
          <ContentInfoBanner />

          {/* CSV import status */}
          {importCsv.isSuccess && importCsv.data && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-800">
              <CheckCircle className="size-4 shrink-0" />
              <span>
                Imported {importCsv.data.imported} experiences successfully.
              </span>
            </div>
          )}
          {importCsv.isError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
              <AlertCircle className="size-4 shrink-0" />
              <span>{(importCsv.error as Error).message}</span>
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <ContentCatalogToolbar
                search={search}
                onSearchChange={setSearch}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                summary={`${allExperiences.length} experiences · ${activeCount} active`}
              />
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleCsvUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importCsv.isPending}
                className="font-inter inline-flex items-center gap-2 rounded-lg border border-[#e5e0d8] bg-white px-3.5 py-2 text-sm font-medium text-manager-text shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:bg-[#faf8f5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Upload className="size-3.5" />
                {importCsv.isPending ? 'Importing…' : 'Import CSV'}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-52 animate-pulse rounded-xl bg-manager-border"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((experience) => (
                <ExperienceCard
                  key={experience.id}
                  experience={experience}
                  onToggle={() => toggleActive.mutate(experience.id)}
                />
              ))}
              <AddExperienceCard />
            </div>
          )}
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
