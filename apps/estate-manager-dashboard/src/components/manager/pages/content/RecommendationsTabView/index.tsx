'use client';

import { useState } from 'react';
import { MapPin, Star, ExternalLink, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Recommendation } from '@repo/api-types';

import {
  useRecommendations,
  useUpdateRecommendation,
} from '@/hooks/useCatalogAdmin';
import { RecommendationFormDialog } from '@/components/manager/pages/content/RecommendationFormDialog';

export const RecommendationsTabView = () => {
  const { data: recs, isLoading } = useRecommendations();
  const update = useUpdateRecommendation();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Recommendation | null>(null);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (rec: Recommendation) => {
    setEditing(rec);
    setFormOpen(true);
  };

  const toggleFeatured = (rec: Recommendation) =>
    update.mutate({ id: rec.id, data: { isFeatured: !rec.isFeatured } });

  const remove = (rec: Recommendation) => {
    if (!confirm(`Remove “${rec.name}”?`)) return;
    update.mutate(
      { id: rec.id, data: { isActive: false } },
      {
        onSuccess: () => toast.success('Recommendation removed'),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-xl bg-manager-border" />
        ))}
      </div>
    );
  }

  const items = (recs ?? []).filter((r) => r.isActive);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((rec) => (
          <div
            key={rec.id}
            className="flex flex-col overflow-hidden rounded-xl border border-manager-border bg-white shadow-[0_1px_3px_rgba(26,22,20,0.04)]"
          >
            {rec.photoUrl && (
              <div className="h-28 w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={rec.photoUrl} alt={rec.name} className="size-full object-cover" />
              </div>
            )}
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[1.5px] text-manager-text-muted">
                    {rec.category}
                  </p>
                  <h3 className="mt-0.5 text-sm font-semibold text-manager-text">
                    {rec.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFeatured(rec)}
                  aria-label="Toggle featured"
                  className={
                    rec.isFeatured
                      ? 'inline-flex shrink-0 items-center gap-1 rounded-full bg-[#fdf3e3] px-2 py-0.5 text-[10px] font-medium text-[#8b6914]'
                      : 'inline-flex shrink-0 items-center gap-1 rounded-full border border-manager-border px-2 py-0.5 text-[10px] font-medium text-manager-text-muted'
                  }
                >
                  <Star className={`size-2.5 ${rec.isFeatured ? 'fill-current' : ''}`} />
                  Featured
                </button>
              </div>
              {rec.location && (
                <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-manager-text-muted">
                  <MapPin className="size-3" />
                  {rec.location}
                </p>
              )}
              {rec.description && (
                <p className="mt-1.5 line-clamp-3 text-xs text-manager-text-muted">
                  {rec.description}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between">
                {rec.externalUrl ? (
                  <a
                    href={rec.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-manager-accent"
                  >
                    Visit
                    <ExternalLink className="size-3" />
                  </a>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(rec)}
                    aria-label="Edit"
                    className="rounded-md p-1.5 text-manager-text-muted hover:bg-[#f5f0e8] hover:text-manager-text"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(rec)}
                    aria-label="Remove"
                    className="rounded-md p-1.5 text-manager-text-muted hover:bg-[#fdecec] hover:text-[#b42318]"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={openAdd}
          className="flex min-h-[176px] flex-col items-center justify-center rounded-xl border border-dashed border-[#d4d0c8] bg-white p-6 text-center transition-colors hover:border-manager-accent/40 hover:bg-[#faf9f7]"
        >
          <span className="flex size-11 items-center justify-center rounded-full border border-[#e5e0d8] bg-[#f7f5f2]">
            <Plus className="size-5 text-manager-text-muted" />
          </span>
          <span className="mt-3 text-sm font-medium text-manager-text">
            Add recommendation
          </span>
        </button>
      </div>

      <RecommendationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
      />
    </>
  );
};
