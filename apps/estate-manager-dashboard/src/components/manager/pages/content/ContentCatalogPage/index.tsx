'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

import { AddExperienceCard } from '@/components/manager/pages/content/AddExperienceCard';
import { CategoryManageDialog } from '@/components/manager/pages/content/CategoryManageDialog';
import { ContentCatalogTabs } from '@/components/manager/pages/content/ContentCatalogTabs';
import { ContentCatalogToolbar } from '@/components/manager/pages/content/ContentCatalogToolbar';
import { ContentInfoBanner } from '@/components/manager/pages/content/ContentInfoBanner';
import { ExperienceCard } from '@/components/manager/pages/content/ExperienceCard';
import { ExperienceFormDialog } from '@/components/manager/pages/content/ExperienceFormDialog';
import {
  registerOpenExperienceForm,
  unregisterOpenExperienceForm,
} from '@/lib/content-catalog-actions';
import type { ContentCatalogTab, ContentExperience } from '@/types';
import {
  useCatalogAdmin,
  useToggleCatalogItem,
  useImportCatalogCsv,
} from '@/hooks/useCatalogAdmin';
import { useExperienceCategories } from '@/hooks/useExperienceCategories';
import { ExperienceDeleteDialog } from '@/components/manager/pages/content/ExperienceDeleteDialog';
import { MenusTabView } from '@/components/manager/pages/content/MenusTabView';
import { RecommendationsTabView } from '@/components/manager/pages/content/RecommendationsTabView';
import { useMenu } from '@/hooks/useMenu';
import { useRecommendations } from '@/hooks/useCatalogAdmin';
import { mapCatalogItemToContentExperience } from '@/lib/mappers/catalog';

type FilterValue = 'all' | string;

function filterExperiences(
  items: ContentExperience[],
  filter: FilterValue,
  query: string,
) {
  let result = items;
  if (filter !== 'all') {
    result = result.filter((item) => item.experienceCategoryId === filter);
  }
  const q = query.trim().toLowerCase();
  if (!q) return result;
  return result.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.categoryLabel.toLowerCase().includes(q) ||
      item.pricing.includes(q),
  );
}

export const ContentCatalogPage = () => {
  const [activeTab, setActiveTab] = useState<ContentCatalogTab>('experiences');
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
  const [search, setSearch] = useState('');
  const [experienceFormOpen, setExperienceFormOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingExperience, setEditingExperience] =
    useState<ContentExperience | null>(null);
  const [deletingExperience, setDeletingExperience] =
    useState<ContentExperience | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: catalogData, isLoading } = useCatalogAdmin();
  const { data: categories = [], isLoading: categoriesLoading } =
    useExperienceCategories();
  const { data: menuItems = [] } = useMenu();
  const { data: recommendations = [] } = useRecommendations();
  const toggleActive = useToggleCatalogItem();
  const importCsv = useImportCatalogCsv();

  const openExperienceForm = useCallback(
    (experienceId?: string) => {
      if (experienceId) {
        const match = (catalogData ?? [])
          .map(mapCatalogItemToContentExperience)
          .find((item) => item.id === experienceId);
        setEditingExperience(match ?? null);
      } else {
        setEditingExperience(null);
      }
      setExperienceFormOpen(true);
    },
    [catalogData],
  );

  useEffect(() => {
    registerOpenExperienceForm(openExperienceForm);
    return () => unregisterOpenExperienceForm();
  }, [openExperienceForm]);

  const allExperiences = useMemo(
    () => (catalogData ?? []).map(mapCatalogItemToContentExperience),
    [catalogData],
  );

  const filtered = useMemo(
    () => filterExperiences(allExperiences, activeFilter, search),
    [allExperiences, activeFilter, search],
  );

  const activeCount = allExperiences.filter((item) => item.active).length;

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isCsv =
      file.name.toLowerCase().endsWith('.csv') ||
      file.type === 'text/csv' ||
      file.type === 'application/vnd.ms-excel';
    if (!isCsv) {
      setUploadError(
        'Please upload a .csv file. If your catalog is an Excel/Sheets file, export it as CSV first (File → Save As / Download → CSV).',
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setUploadError(null);
    importCsv.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="font-inter space-y-6">
      <ContentCatalogTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        experienceCount={allExperiences.length}
        menuCount={menuItems.length}
        recommendationCount={recommendations.length}
      />

      {activeTab === 'experiences' ? (
        <div className="space-y-6">
          <ContentInfoBanner />

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
          {uploadError && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              <AlertCircle className="size-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleCsvUpload}
          />
          <ContentCatalogToolbar
            search={search}
            onSearchChange={setSearch}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            summary={`${allExperiences.length} experiences · ${activeCount} active`}
            categories={categories}
            loading={isLoading || categoriesLoading}
            onManageCategories={() => setCategoryDialogOpen(true)}
            action={
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importCsv.isPending}
                className="font-inter inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-[#e5e0d8] bg-white px-3.5 text-sm font-medium text-manager-text shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:bg-[#faf8f5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Upload className="size-3.5 shrink-0" />
                {importCsv.isPending ? 'Importing…' : 'Import CSV'}
              </button>
            }
          />

          <p className="-mt-2 text-xs text-manager-text-muted">
            Bulk import: upload a <span className="font-medium">.csv</span> file
            (export your catalog spreadsheet as CSV first). Each{' '}
            <span className="font-medium">Category</span> becomes a filter, and a
            placeholder image is added that you can replace per experience.
          </p>

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
                  onEdit={() => openExperienceForm(experience.id)}
                  onDelete={() => setDeletingExperience(experience)}
                />
              ))}
              <AddExperienceCard onClick={() => openExperienceForm()} />
            </div>
          )}
        </div>
      ) : activeTab === 'menus' ? (
        <MenusTabView />
      ) : (
        <RecommendationsTabView />
      )}

      <ExperienceFormDialog
        open={experienceFormOpen}
        onOpenChange={setExperienceFormOpen}
        experience={editingExperience}
      />

      <CategoryManageDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
      />

      <ExperienceDeleteDialog
        open={!!deletingExperience}
        onOpenChange={(open) => !open && setDeletingExperience(null)}
        experienceId={deletingExperience?.id ?? null}
        experienceName={deletingExperience?.name ?? ''}
      />
    </div>
  );
};
