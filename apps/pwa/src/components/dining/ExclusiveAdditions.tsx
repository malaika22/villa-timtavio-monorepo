'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { formatPrice } from '@repo/api-types';
import type { DiningRequest, MenuItem } from '@repo/api-types';
import { cn } from '@repo/ui/lib/utils';

import { useAuth } from '@/hooks/useAuth';
import { useCreateDiningRequest } from '@/hooks/useDining';
import { DishThumb } from './DishThumb';

/** Sittings a bottle can be attached to — confirmed or not, it's their table. */
const ATTACHABLE = ['REQUESTED', 'CONFIRMED'];

/**
 * The only chargeable part of dining.
 *
 * Everything else on this page is included in the stay, and there is not a
 * single price anywhere else on it — which is the whole design problem. The
 * block is bordered and warm-grounded, the eyebrow above it says "additional
 * charge" before a price is read, and no included dish ever carries a number.
 */
export const ExclusiveAdditions = ({
  items,
  sittings,
}: {
  items: MenuItem[];
  /** The party's sittings, so a bottle can arrive at the right table. */
  sittings: DiningRequest[];
}) => {
  const { isPrimary } = useAuth();
  const create = useCreateDiningRequest();
  const [chosen, setChosen] = useState<MenuItem | null>(null);
  const [linkedSittingId, setLinkedSittingId] = useState<string | null>(null);

  if (items.length === 0) return null;

  const attachable = sittings.filter((s) => ATTACHABLE.includes(s.status));

  const close = () => {
    setChosen(null);
    setLinkedSittingId(null);
    create.reset();
  };

  const submit = () => {
    if (!chosen) return;
    create.mutate(
      {
        kind: 'ORDER',
        items: [{ menuItemId: chosen.id, name: chosen.name, quantity: 1 }],
        linkedSittingId: linkedSittingId ?? undefined,
      } as never,
      { onSuccess: close },
    );
  };

  return (
    <>
      <p className="mb-2 text-[8px] uppercase tracking-[2.5px] text-[#9A9288]">
        Additional charge
      </p>

      <section className="mb-6 overflow-hidden rounded-[12px] border border-[#B08D57] bg-gradient-to-b from-[#FBF3DF] via-white to-white">
        <div className="px-3.5 pt-3 pb-2">
          <p className="font-cormorant text-[15px] text-[#2B2824]">
            Exclusive additions
          </p>
          <p className="mt-0.5 text-[9.5px] leading-relaxed text-[#8A6D3B]">
            The cellar and the reserve list. These are charged to the villa
            folio — everything else on this page is included.
          </p>
        </div>

        <ul>
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2.5 border-t border-[#F0EDE6] px-3.5 py-2.5"
            >
              <DishThumb
                photoUrl={item.photoUrl}
                name={item.name}
                className="!size-11 !rounded-[8px]"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] text-[#2B2824]">
                  {item.name}
                </span>
                {item.description && (
                  <span className="mt-0.5 block text-[9.5px] leading-snug text-[#797168]">
                    {item.description}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-[12px] tabular-nums text-[#8A6D3B]">
                {formatPrice(Number(item.price ?? 0))}
              </span>
              <button
                type="button"
                onClick={() => setChosen(item)}
                aria-label={`Add ${item.name}`}
                className="flex size-[22px] shrink-0 items-center justify-center rounded-full border border-[#B08D57] text-[13px] leading-none text-[#8A6D3B]"
              >
                +
              </button>
            </li>
          ))}
        </ul>
      </section>

      {chosen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="absolute inset-0 bg-[#14120E]/45"
          />
          <div className="relative rounded-t-[16px] bg-white px-4 pt-3 pb-6">
            <span
              className="mx-auto mb-2 block h-1 w-9 rounded-full bg-[#E3E0DA]"
              aria-hidden
            />
            <p className="font-cormorant text-[17px] text-[#2B2824]">
              {chosen.name}
            </p>
            <p className="mt-0.5 text-[10px] text-[#797168]">
              {chosen.description}
              {chosen.description ? ' · ' : ''}
              {formatPrice(Number(chosen.price ?? 0))}
            </p>

            {attachable.length > 0 && (
              <>
                <p className="mt-3 mb-1.5 text-[8px] uppercase tracking-[2.2px] text-[#9A9288]">
                  When
                </p>
                <div className="flex flex-col gap-1.5">
                  {attachable.map((sitting) => (
                    <Choice
                      key={sitting.id}
                      on={linkedSittingId === sitting.id}
                      onSelect={() => setLinkedSittingId(sitting.id)}
                      main={`With ${
                        sitting.mealType
                          ? sitting.mealType.charAt(0) +
                            sitting.mealType.slice(1).toLowerCase()
                          : 'your sitting'
                      }${
                        sitting.date
                          ? ` on ${format(new Date(sitting.date), 'EEEE')}`
                          : ''
                      }`}
                      sub={
                        sitting.time
                          ? `Your table, ${sitting.time} — brought on arrival`
                          : 'Brought to your table'
                      }
                    />
                  ))}
                  <Choice
                    on={linkedSittingId === null}
                    onSelect={() => setLinkedSittingId(null)}
                    main="Bring it to the villa"
                    sub="As soon as it can be brought up"
                  />
                </div>
              </>
            )}

            <div className="mt-3 flex items-baseline justify-between border-t border-[#E3E0DA] pt-2.5">
              <span className="text-[10.5px] text-[#797168]">1 ×</span>
              <span className="font-cormorant text-[18px] tabular-nums text-[#2B2824]">
                {formatPrice(Number(chosen.price ?? 0))}
              </span>
            </div>

            <p className="mt-1.5 text-[9px] leading-relaxed text-[#9A9288]">
              {isPrimary
                ? 'Charged to the villa folio when the estate confirms. Nothing is charged if it can’t be supplied.'
                : 'The primary member approves this before the estate acts, since it goes on their folio. Nothing is charged until then.'}
            </p>

            {create.isError && (
              <p className="mt-2 text-[10px] text-[#9A4A38]">
                {(create.error as Error).message}
              </p>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={create.isPending}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#0F1F2E] py-3 text-[10px] font-semibold uppercase tracking-[2px] text-white disabled:opacity-60"
            >
              {create.isPending && <Loader2 className="size-3.5 animate-spin" />}
              Request it
            </button>
            <button
              type="button"
              onClick={close}
              className="mt-2 w-full py-2 text-[10px] font-medium uppercase tracking-[1.6px] text-[#797168]"
            >
              Not now
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const Choice = ({
  on,
  onSelect,
  main,
  sub,
}: {
  on: boolean;
  onSelect: () => void;
  main: string;
  sub: string;
}) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={on}
    className={cn(
      'flex items-center gap-2 rounded-[9px] border px-2.5 py-2 text-left',
      on ? 'border-[#B08D57] bg-[#FBF3DF]' : 'border-[#E3E0DA] bg-white',
    )}
  >
    <span
      className={cn(
        'size-[13px] shrink-0 rounded-full border-[1.5px]',
        on
          ? 'border-[#8A6D3B] bg-[#8A6D3B] shadow-[inset_0_0_0_2.5px_#fff]'
          : 'border-[#9A9288]',
      )}
      aria-hidden
    />
    <span>
      <span className="block text-[11px] text-[#2B2824]">{main}</span>
      <span className="mt-0.5 block text-[9px] text-[#9A9288]">{sub}</span>
    </span>
  </button>
);
