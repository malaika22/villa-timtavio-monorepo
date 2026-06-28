'use client';

import { MapPin, Star, ExternalLink } from 'lucide-react';
import { useRecommendations } from '@/hooks/useCatalogAdmin';

export const RecommendationsTabView = () => {
  const { data: recs, isLoading } = useRecommendations();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-xl bg-manager-border" />
        ))}
      </div>
    );
  }

  if (!recs || recs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#d4d0c8] bg-white px-6 py-12 text-center">
        <p className="text-sm text-manager-text-muted">
          No local recommendations yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {recs.map((rec) => (
        <div
          key={rec.id}
          className="flex flex-col overflow-hidden rounded-xl border border-manager-border bg-white shadow-[0_1px_3px_rgba(26,22,20,0.04)]"
        >
          {rec.photoUrl && (
            <div className="h-28 w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rec.photoUrl}
                alt={rec.name}
                className="size-full object-cover"
              />
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
              {rec.isFeatured && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#fdf3e3] px-2 py-0.5 text-[10px] font-medium text-[#8b6914]">
                  <Star className="size-2.5 fill-current" />
                  Featured
                </span>
              )}
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
            {rec.externalUrl && (
              <a
                href={rec.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-manager-accent"
              >
                Visit
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
