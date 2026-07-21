'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  UtensilsCrossed,
  Coffee,
  Plus,
  Minus,
  Check,
  Clock,
  Loader2,
} from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { Drawer, DrawerContent, DrawerTitle } from '@repo/ui/components/drawer';
import type {
  MealType,
  MenuCategory,
  MenuItem,
  DiningRequest,
  DiningOrderItem,
} from '@repo/api-types';
import { useMenu, useDiningRequests, useCreateDiningRequest } from '@/hooks/useDining';
import { CalenderPicker } from '../CalenderPicker';
import { GuestStepper } from '../RequestExperienceSheet/GuestStepper';

const MEAL_CATEGORIES: { value: MealType; label: string }[] = [
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
];
const ORDER_CATEGORIES: { value: MenuCategory; label: string }[] = [
  { value: 'SNACKS', label: 'Snacks' },
  { value: 'BEVERAGES', label: 'Beverages' },
];

const DIET_BADGES: { key: keyof MenuItem; label: string; tone: string }[] = [
  { key: 'isVegetarian', label: 'Vegetarian', tone: 'bg-[#EAF3E0] text-[#3A5E1E]' },
  { key: 'isVegan', label: 'Vegan', tone: 'bg-[#EAF3E0] text-[#3A5E1E]' },
  { key: 'isGlutenFree', label: 'Gluten free', tone: 'bg-[#E8ECF5] text-[#2E3F66]' },
  { key: 'containsNuts', label: 'Contains nuts', tone: 'bg-[#FBEEEA] text-[#9A3A30]' },
  { key: 'containsShellfish', label: 'Contains shellfish', tone: 'bg-[#FBEEEA] text-[#9A3A30]' },
];

function DietBadges({ item }: { item: MenuItem }) {
  const badges = DIET_BADGES.filter((b) => item[b.key]);
  if (badges.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {badges.map((b) => (
        <span
          key={b.label}
          className={cn('rounded-full px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.5px]', b.tone)}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}

export const DiningPage = () => {
  const router = useRouter();
  const { data: menu, isLoading } = useMenu();
  const { data: requests } = useDiningRequests();

  const [sittingOpen, setSittingOpen] = useState(false);
  const [cart, setCart] = useState<Record<string, { item: MenuItem; qty: number }>>({});
  const [orderOpen, setOrderOpen] = useState(false);

  const byCategory = useMemo(() => {
    const map: Record<string, MenuItem[]> = {};
    for (const m of menu ?? []) {
      (map[m.category] ??= []).push(m);
    }
    return map;
  }, [menu]);

  const cartCount = Object.values(cart).reduce((s, c) => s + c.qty, 0);

  const addToCart = (item: MenuItem) =>
    setCart((c) => ({
      ...c,
      [item.id]: { item, qty: (c[item.id]?.qty ?? 0) + 1 },
    }));
  const removeFromCart = (id: string) =>
    setCart((c) => {
      const next = { ...c };
      const cur = next[id];
      if (!cur) return next;
      if (cur.qty <= 1) delete next[id];
      else next[id] = { ...cur, qty: cur.qty - 1 };
      return next;
    });

  return (
    <div className="flex flex-col pb-28">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[2px] text-[#797168]"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back
        </button>
        <h1 className="font-cormorant text-[22px] italic text-[#2B2824]">Dining</h1>
        <span className="w-9" />
      </div>

      <p className="mb-5 text-[11px] leading-relaxed text-[#797168]">
        All-inclusive food &amp; drink. Reserve a table for a meal, or order
        snacks &amp; beverages to the villa.
      </p>

      {/* Your requests */}
      {requests && requests.length > 0 && (
        <section className="mb-6">
          <p className="mb-2 text-[8px] uppercase tracking-[2.5px] text-[#9A9288]">
            Your dining
          </p>
          <div className="flex flex-col gap-2">
            {requests.map((r) => (
              <RequestRow key={r.id} request={r} />
            ))}
          </div>
        </section>
      )}

      {/* Reserve a sitting */}
      <button
        onClick={() => setSittingOpen(true)}
        className="mb-6 flex items-center justify-between rounded-[12px] border border-[#0F1F2E] bg-[#0F1F2E] px-4 py-3.5 text-left text-white"
      >
        <span className="flex items-center gap-2.5">
          <UtensilsCrossed className="size-4" aria-hidden />
          <span className="text-[12px] font-medium">Reserve a sitting</span>
        </span>
        <span className="text-[9px] uppercase tracking-[1.5px] text-white/60">
          Breakfast · Lunch · Dinner
        </span>
      </button>

      {/* Menu */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-[12px] bg-[#E3E0DA]" />
          ))}
        </div>
      ) : (menu?.length ?? 0) === 0 ? (
        <p className="rounded-[12px] border border-dashed border-[#C9C4BC] bg-[#F7F5F2] px-4 py-8 text-center text-[11px] text-[#797168]">
          The menu is being prepared. Check back soon.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {[...MEAL_CATEGORIES, ...ORDER_CATEGORIES].map((cat) => {
            const items = byCategory[cat.value] ?? [];
            if (items.length === 0) return null;
            const orderable = ORDER_CATEGORIES.some((o) => o.value === cat.value);
            return (
              <section key={cat.value}>
                <p className="mb-2.5 text-[8px] uppercase tracking-[2.5px] text-[#9A9288]">
                  {cat.label}
                </p>
                <div className="flex flex-col gap-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-[12px] border border-[#E3E0DA] bg-white px-3.5 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-[#2B2824]">{item.name}</p>
                        {item.description && (
                          <p className="mt-0.5 text-[10.5px] leading-snug text-[#797168]">
                            {item.description}
                          </p>
                        )}
                        <DietBadges item={item} />
                      </div>
                      {orderable && (
                        <div className="shrink-0">
                          {cart[item.id] ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="flex size-7 items-center justify-center rounded-full border border-[#E3E0DA] text-[#2B2824]"
                                aria-label="Remove one"
                              >
                                <Minus className="size-3.5" />
                              </button>
                              <span className="min-w-[1ch] text-center text-[13px] font-medium text-[#2B2824]">
                                {cart[item.id].qty}
                              </span>
                              <button
                                onClick={() => addToCart(item)}
                                className="flex size-7 items-center justify-center rounded-full bg-[#0F1F2E] text-white"
                                aria-label="Add one"
                              >
                                <Plus className="size-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="flex items-center gap-1 rounded-full border border-[#0F1F2E] px-2.5 py-1 text-[10px] font-medium text-[#0F1F2E]"
                            >
                              <Plus className="size-3" /> Order
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Floating order bar */}
      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#F0EDE6] via-[#F0EDE6]/95 to-transparent px-4 pb-8 pt-6">
          <button
            onClick={() => setOrderOpen(true)}
            className="flex w-full items-center justify-between rounded-[12px] bg-[#0F1F2E] px-4 py-3.5 text-white"
          >
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[1.5px]">
              <Coffee className="size-4" /> Review order
            </span>
            <span className="flex size-6 items-center justify-center rounded-full bg-white/15 text-[11px] font-bold">
              {cartCount}
            </span>
          </button>
        </div>
      )}

      <SittingSheet open={sittingOpen} onClose={() => setSittingOpen(false)} />
      <OrderSheet
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        cart={cart}
        onClear={() => setCart({})}
        onAdd={addToCart}
        onRemove={removeFromCart}
      />
    </div>
  );
};

// ─── Existing request row ──────────────────────────────────────────────────

const STATUS_TONE: Record<string, string> = {
  REQUESTED: 'bg-[#FAEEDA] text-[#854F0B]',
  CONFIRMED: 'bg-[#EAF3E8] text-[#3A5E48]',
  CANCELLED: 'bg-[#EEE] text-[#9A9288]',
};

function RequestRow({ request: r }: { request: DiningRequest }) {
  const isSitting = r.kind === 'SITTING';
  const items = (r.items ?? []) as DiningOrderItem[];
  return (
    <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[#E3E0DA] bg-white px-3.5 py-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#F0EDE8]">
          {isSitting ? (
            <UtensilsCrossed className="size-3.5 text-[#5C534A]" />
          ) : (
            <Coffee className="size-3.5 text-[#5C534A]" />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-[#2B2824]">
            {isSitting
              ? `${r.mealType ? r.mealType[0] + r.mealType.slice(1).toLowerCase() : 'Sitting'}${r.partySize ? ` · ${r.partySize}` : ''}`
              : `Order · ${items.length} item${items.length === 1 ? '' : 's'}`}
          </p>
          <p className="text-[10px] text-[#797168]">
            {isSitting
              ? `${r.date ? format(new Date(r.date), 'MMM d') : ''}${r.time ? ` · ${r.time}` : ''}`
              : items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
          </p>
        </div>
      </div>
      <span
        className={cn(
          'shrink-0 rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[1px]',
          STATUS_TONE[r.status] ?? STATUS_TONE.REQUESTED,
        )}
      >
        {r.status}
      </span>
    </div>
  );
}

// ─── Sitting reservation sheet ─────────────────────────────────────────────

function SittingSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateDiningRequest();
  const [meal, setMeal] = useState<MealType>('DINNER');
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState('19:30');
  const [party, setParty] = useState(2);
  const [allergies, setAllergies] = useState('');
  const [special, setSpecial] = useState('');
  const [done, setDone] = useState(false);

  const submit = async () => {
    await create.mutateAsync({
      kind: 'SITTING',
      mealType: meal,
      date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      time,
      partySize: party,
      allergies: allergies || undefined,
      specialRequests: special || undefined,
    });
    setDone(true);
  };

  const close = () => {
    onClose();
    setTimeout(() => setDone(false), 200);
  };

  return (
    <Drawer open={open} onOpenChange={(v) => !v && close()} direction="right">
      <DrawerContent className="flex h-full w-full flex-col border-0 bg-[#FAF8F4] p-0 data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:rounded-none">
        <DrawerTitle className="sr-only">Reserve a sitting</DrawerTitle>
        <div className="flex shrink-0 items-center gap-3 border-b border-[#E3E0DA] px-5 pb-4 pt-5">
          <button onClick={close} className="text-[#2B2824]" aria-label="Close">
            <ArrowLeft className="size-5" />
          </button>
          <p className="text-[10px] font-medium uppercase tracking-[2.8px] text-[#2B2824]">
            Reserve a sitting
          </p>
        </div>

        {done ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#EAF3E8]">
              <Check className="size-6 text-[#3A5E48]" strokeWidth={2.5} />
            </div>
            <h2 className="font-cormorant text-[26px] italic text-[#2B2824]">Sitting requested</h2>
            <p className="text-[12px] text-[#797168]">
              The estate will confirm your table shortly.
            </p>
            <button
              onClick={close}
              className="mt-2 rounded-[10px] bg-[#0F1F2E] px-6 py-3 text-[10px] font-semibold uppercase tracking-[2px] text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <Field label="Meal">
                <div className="flex gap-2">
                  {MEAL_CATEGORIES.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMeal(m.value)}
                      className={cn(
                        'flex-1 rounded-full border px-3 py-2 text-[12px] transition-colors',
                        meal === m.value
                          ? 'border-[#0F1F2E] bg-[#0F1F2E] text-white'
                          : 'border-[#E3E0DA] text-[#797168]',
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Date">
                <CalenderPicker selectedDate={date} onSelect={setDate} />
              </Field>

              <Field label="Time">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="rounded-xl border border-[#E3E0DA] bg-white px-4 py-3 text-[13px] text-[#2B2824] outline-none"
                />
              </Field>

              <Field label="Party size">
                <GuestStepper count={party} max={16} onChange={setParty} />
              </Field>

              <Field label="Allergies">
                <textarea
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  rows={2}
                  placeholder="e.g. Severe nut allergy"
                  className="w-full resize-none rounded-xl border border-[#E3E0DA] bg-white px-4 py-3 text-[13px] outline-none placeholder:text-[#B0AAA0]"
                />
              </Field>

              <Field label="Special requests">
                <textarea
                  value={special}
                  onChange={(e) => setSpecial(e.target.value)}
                  rows={2}
                  placeholder="Occasion, seating preference…"
                  className="w-full resize-none rounded-xl border border-[#E3E0DA] bg-white px-4 py-3 text-[13px] outline-none placeholder:text-[#B0AAA0]"
                />
              </Field>
            </div>
            <div className="shrink-0 border-t border-[#E3E0DA] bg-[#FAF8F4] px-5 py-4">
              <button
                onClick={submit}
                disabled={create.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F1F2E] py-4 text-[11px] font-semibold uppercase tracking-[2px] text-white disabled:opacity-60"
              >
                {create.isPending && <Loader2 className="size-4 animate-spin" />}
                {create.isPending ? 'Requesting…' : 'Request sitting'}
              </button>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

// ─── Snack / beverage order sheet ──────────────────────────────────────────

function OrderSheet({
  open,
  onClose,
  cart,
  onClear,
  onAdd,
  onRemove,
}: {
  open: boolean;
  onClose: () => void;
  cart: Record<string, { item: MenuItem; qty: number }>;
  onClear: () => void;
  onAdd: (item: MenuItem) => void;
  onRemove: (id: string) => void;
}) {
  const create = useCreateDiningRequest();
  const [when, setWhen] = useState('now');
  const [notes, setNotes] = useState('');
  const [done, setDone] = useState(false);

  const entries = Object.values(cart);

  const submit = async () => {
    await create.mutateAsync({
      kind: 'ORDER',
      items: entries.map((e) => ({
        menuItemId: e.item.id,
        name: e.item.name,
        quantity: e.qty,
      })),
      requestedFor: when,
      notes: notes || undefined,
    });
    setDone(true);
    onClear();
  };

  const close = () => {
    onClose();
    setTimeout(() => setDone(false), 200);
  };

  return (
    <Drawer open={open} onOpenChange={(v) => !v && close()} direction="right">
      <DrawerContent className="flex h-full w-full flex-col border-0 bg-[#FAF8F4] p-0 data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:rounded-none">
        <DrawerTitle className="sr-only">Your order</DrawerTitle>
        <div className="flex shrink-0 items-center gap-3 border-b border-[#E3E0DA] px-5 pb-4 pt-5">
          <button onClick={close} className="text-[#2B2824]" aria-label="Close">
            <ArrowLeft className="size-5" />
          </button>
          <p className="text-[10px] font-medium uppercase tracking-[2.8px] text-[#2B2824]">
            Your order
          </p>
        </div>

        {done ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#EAF3E8]">
              <Check className="size-6 text-[#3A5E48]" strokeWidth={2.5} />
            </div>
            <h2 className="font-cormorant text-[26px] italic text-[#2B2824]">Order placed</h2>
            <p className="text-[12px] text-[#797168]">
              The estate will bring it over shortly.
            </p>
            <button
              onClick={close}
              className="mt-2 rounded-[10px] bg-[#0F1F2E] px-6 py-3 text-[10px] font-semibold uppercase tracking-[2px] text-white"
            >
              Done
            </button>
          </div>
        ) : entries.length === 0 ? (
          <p className="flex-1 px-5 py-16 text-center text-[12px] text-[#B0AAA0]">
            Your order is empty.
          </p>
        ) : (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <div className="flex flex-col gap-2">
                {entries.map(({ item, qty }) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-[12px] border border-[#E3E0DA] bg-white px-3.5 py-2.5"
                  >
                    <span className="text-[13px] font-medium text-[#2B2824]">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRemove(item.id)}
                        className="flex size-7 items-center justify-center rounded-full border border-[#E3E0DA]"
                        aria-label="Remove one"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="min-w-[1ch] text-center text-[13px] font-medium">{qty}</span>
                      <button
                        onClick={() => onAdd(item)}
                        className="flex size-7 items-center justify-center rounded-full bg-[#0F1F2E] text-white"
                        aria-label="Add one"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <Field label="When">
                <div className="flex gap-2">
                  {[
                    { v: 'now', l: 'As soon as possible' },
                    { v: 'later', l: 'Later (note below)' },
                  ].map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setWhen(o.v)}
                      className={cn(
                        'flex-1 rounded-full border px-3 py-2 text-[11px] transition-colors',
                        when === o.v
                          ? 'border-[#0F1F2E] bg-[#0F1F2E] text-white'
                          : 'border-[#E3E0DA] text-[#797168]',
                      )}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Notes">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Delivery spot, timing, preferences…"
                  className="w-full resize-none rounded-xl border border-[#E3E0DA] bg-white px-4 py-3 text-[13px] outline-none placeholder:text-[#B0AAA0]"
                />
              </Field>
            </div>
            <div className="shrink-0 border-t border-[#E3E0DA] bg-[#FAF8F4] px-5 py-4">
              <button
                onClick={submit}
                disabled={create.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F1F2E] py-4 text-[11px] font-semibold uppercase tracking-[2px] text-white disabled:opacity-60"
              >
                {create.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Clock className="size-4" />
                )}
                {create.isPending ? 'Placing…' : 'Place order'}
              </button>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="mb-3 text-[9px] font-medium uppercase tracking-[2.8px] text-[#B0AAA0]">
        {label}
      </p>
      {children}
    </section>
  );
}
