'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/components/sheet';
import { AlertTriangle, ChefHat, Wine, Utensils } from 'lucide-react';
import type { ChefsBriefResponse } from '@repo/api-types';

const DIETARY_LABEL: Record<string, string> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  gluten_free: 'Gluten-free',
  halal: 'Halal',
  kosher: 'Kosher',
  no_shellfish: 'No shellfish',
  no_nuts: 'No nuts',
  no_dairy: 'No dairy',
  other: 'Other',
};

function label(key: string): string {
  return DIETARY_LABEL[key] ?? key.replace(/_/g, ' ');
}

type Props = {
  open: boolean;
  onClose: () => void;
  brief: ChefsBriefResponse | null | undefined;
};

export function ChefsBriefSheet({ open, onClose, brief }: Props) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto bg-[#fdfdfb] p-0 sm:max-w-[520px]"
      >
        <SheetHeader className="border-b border-[#e8e4de] px-6 pb-4 pt-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-[#1a1614]">
              <ChefHat className="size-4 text-white" aria-hidden />
            </span>
            <div>
              <SheetTitle className="font-cormorant text-2xl font-medium leading-tight text-[#1a1614]">
                Chef&apos;s Brief
              </SheetTitle>
              <p className="mt-0.5 text-sm text-[#8a8178]">
                {brief
                  ? `${brief.totalGuests} guests · dietary & allergy summary`
                  : 'Loading…'}
              </p>
            </div>
          </div>
        </SheetHeader>

        {!brief ? (
          <div className="px-6 py-10 text-center text-sm text-[#8a8178]">
            Preparing the brief…
          </div>
        ) : (
          <div className="space-y-6 px-6 py-5">
            {/* Allergies — highlighted coral */}
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#c53030]">
                <AlertTriangle className="size-3.5" aria-hidden />
                Allergies ({brief.allergies.length})
              </h3>
              {brief.allergies.length === 0 ? (
                <p className="text-sm italic text-[#8a8178]">
                  No allergies reported across the party.
                </p>
              ) : (
                <ul className="space-y-2">
                  {brief.allergies.map((a, i) => (
                    <li
                      key={`${a.guest}-${i}`}
                      className="rounded-xl border border-[#f0c4bc] bg-[#fef6f4] px-4 py-2.5"
                    >
                      <p className="text-sm font-semibold text-[#9a3a30]">
                        {a.guest}
                      </p>
                      <p className="text-sm text-[#6b2626]">{a.allergy}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Dietary summary */}
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#8a8178]">
                <Utensils className="size-3.5" aria-hidden />
                Dietary restrictions
              </h3>
              {Object.keys(brief.dietaryRestrictions).length === 0 ? (
                <p className="text-sm italic text-[#8a8178]">
                  No dietary restrictions on file.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {Object.entries(brief.dietaryRestrictions).map(
                    ([key, guests]) => (
                      <li key={key}>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-medium text-[#1a1614]">
                            {label(key)}
                          </span>
                          <span className="text-xs font-semibold text-[#4a7c59]">
                            ×{guests.length}
                          </span>
                        </div>
                        <p className="text-xs text-[#8a8178]">
                          {guests.join(', ')}
                        </p>
                      </li>
                    ),
                  )}
                </ul>
              )}
            </section>

            {/* Beverages */}
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#8a8178]">
                <Wine className="size-3.5" aria-hidden />
                Beverage preferences
              </h3>
              {brief.beveragePreferences.length === 0 ? (
                <p className="text-sm italic text-[#8a8178]">
                  No beverage preferences on file.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {brief.beveragePreferences.map((b, i) => (
                    <li key={`${b.guest}-${i}`} className="text-sm text-[#3d3530]">
                      <span className="font-medium">{b.guest}:</span>{' '}
                      {b.preference}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Per-guest breakdown */}
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#8a8178]">
                By guest ({brief.guestBreakdown.length})
              </h3>
              <div className="space-y-2">
                {brief.guestBreakdown.map((g, i) => (
                  <div
                    key={`${g.name}-${i}`}
                    className="rounded-xl border border-[#e8e4de] bg-white px-4 py-3"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-[#1a1614]">
                        {g.name}
                      </p>
                      <p className="text-xs text-[#8a8178]">{g.room}</p>
                    </div>
                    {g.dietaryRestrictions.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {g.dietaryRestrictions.map((d) => (
                          <span
                            key={d}
                            className="rounded-full border border-[#3a6448]/25 bg-[#e8f1e9] px-2 py-0.5 text-xs font-medium text-[#3a6448]"
                          >
                            {label(d)}
                          </span>
                        ))}
                      </div>
                    )}
                    {g.allergies && (
                      <p className="mt-1.5 text-xs font-medium text-[#c53030]">
                        ⚠ {g.allergies}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
