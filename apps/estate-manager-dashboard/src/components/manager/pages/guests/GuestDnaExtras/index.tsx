import { Cake, PackageCheck } from 'lucide-react';

import type { GuestDNAProfile } from '@/types';

export const GuestDnaExtras = ({ profile }: { profile: GuestDNAProfile }) => {
  const preStock = profile.preStock ?? [];
  const hasOccasions = !!profile.specialOccasions?.trim();
  const hasPreStock = preStock.length > 0;

  if (!hasOccasions && !hasPreStock) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {hasOccasions ? (
        <section className="rounded-lg border border-[#ead9c0] bg-[#fdf6ec] p-3.5">
          <h3 className="mb-2 flex items-center gap-1.5 text-[10px] font-medium tracking-[0.14em] text-manager-text-muted uppercase">
            <Cake className="size-3.5 text-[#b45309]" />
            Special occasions
          </h3>
          <p className="text-sm leading-relaxed text-manager-text">
            {profile.specialOccasions}
          </p>
        </section>
      ) : null}

      {hasPreStock ? (
        <section className="rounded-lg border border-[#d6e3da] bg-[#f3f9f5] p-3.5">
          <h3 className="mb-2 flex items-center gap-1.5 text-[10px] font-medium tracking-[0.14em] text-manager-text-muted uppercase">
            <PackageCheck className="size-3.5 text-[#2f8f6b]" />
            Pre-stock suggestions
          </h3>
          <ul className="space-y-1.5">
            {preStock.map((s, i) => (
              <li key={i} className="text-sm text-manager-text">
                · {s.description}
                <span className="text-manager-text-muted"> — {s.source}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
};
