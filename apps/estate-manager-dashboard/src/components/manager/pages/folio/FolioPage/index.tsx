'use client';

import { useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Textarea,
} from '@repo/ui';
import { cn } from '@repo/ui/lib/utils';
import { Loader2, Plus, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import type { CreateFolioItemDto, FolioItemType } from '@repo/api-types';

import { useCurrentGuests, useUpcomingGuestsAsList } from '@/hooks/useGuests';
import { useManifest } from '@/hooks/useManifest';
import {
  useFolioEM,
  useAddFolioCharge,
  useUpdateFolioCharge,
  useCheckout,
} from '@/hooks/useFolioEM';

const money = (n: number) =>
  `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** A party member a charge can be attributed to. */
type PartyOption = { email: string; name: string; isPrimary: boolean };

const CHARGE_TYPES: { value: FolioItemType; label: string }[] = [
  { value: 'EXPERIENCE', label: 'Experience' },
  { value: 'DINING', label: 'Dining' },
  { value: 'INCIDENTAL', label: 'Incidental' },
  { value: 'PRE_STOCKED', label: 'Pre-stocked' },
];

export const FolioPage = () => {
  const { data: allGuests = [], isLoading: guestsLoading } = useCurrentGuests();
  const { data: upcomingGuests = [] } = useUpcomingGuestsAsList();

  /**
   * Upcoming stays belong here too.
   *
   * This listed only the party in residence — a screen built when "current
   * stay" meant "the people here now". Pre-arrival planning broke that: guests
   * confirm and are charged for experiences weeks ahead, so a folio exists long
   * before the guest does. And every charge has a 30-minute edit window from
   * when it's logged, so a mistake made in August on a September booking was
   * already past correcting by the time the folio became reachable.
   */
  const guests = useMemo(() => {
    const seen = new Set<string>();
    return [...allGuests, ...upcomingGuests]
      .filter((g) => g.activeBookingId)
      .filter((g) => {
        if (seen.has(g.activeBookingId!)) return false;
        seen.add(g.activeBookingId!);
        return true;
      });
  }, [allGuests, upcomingGuests]);

  const inResidenceIds = useMemo(
    () => new Set(allGuests.map((g) => g.activeBookingId)),
    [allGuests],
  );
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );

  const bookingId = selectedBookingId ?? guests[0]?.activeBookingId ?? null;
  const selectedGuest = guests.find((g) => g.activeBookingId === bookingId);

  const { data: folio, isLoading: folioLoading } = useFolioEM(bookingId);
  // Charges are attributed to a party member so the primary can see what each
  // guest ran up and settle with them independently.
  const { data: manifest } = useManifest(bookingId);
  const partyOptions = useMemo<PartyOption[]>(() => {
    if (!manifest) return [];
    const primary = {
      email: manifest.primaryGuest.email,
      name: `${manifest.primaryGuest.firstName} ${manifest.primaryGuest.lastName}`.trim(),
      isPrimary: true,
    };
    return [
      primary,
      ...manifest.guests
        .filter((g) => !!g.email)
        .map((g) => ({
          email: g.email,
          name: `${g.firstName} ${g.lastName}`.trim(),
          isPrimary: false,
        })),
    ];
  }, [manifest]);
  const addCharge = useAddFolioCharge(bookingId);
  const updateCharge = useUpdateFolioCharge();
  const checkout = useCheckout(bookingId);

  const [chargeOpen, setChargeOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [editItem, setEditItem] = useState<{
    id: string;
    description: string;
    amount: number;
    quantity: number;
  } | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editQty, setEditQty] = useState('1');

  const submitEdit = () => {
    if (!editItem) return;
    const amount = Number(editAmount);
    const quantity = Number(editQty) || 1;
    if (!amount || amount <= 0) return;
    updateCharge.mutate(
      { itemId: editItem.id, dto: { amount, quantity } },
      {
        onSuccess: () => {
          toast.success('Charge updated');
          setEditItem(null);
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
      {/* Guest list */}
      <aside className="rounded-xl border border-manager-border bg-manager-card">
        <p className="border-b border-manager-border px-4 py-3 text-sm font-semibold text-manager-text">
          Guests &amp; upcoming stays
        </p>
        {guestsLoading ? (
          <div className="space-y-2 p-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-lg bg-manager-border"
              />
            ))}
          </div>
        ) : guests.length === 0 ? (
          <p className="p-4 text-sm text-manager-text-muted">
            No stays with a folio yet.
          </p>
        ) : (
          <ul className="p-2">
            {guests.map((g) => (
              <li key={g.activeBookingId}>
                <button
                  type="button"
                  onClick={() => setSelectedBookingId(g.activeBookingId!)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors',
                    g.activeBookingId === bookingId
                      ? 'bg-manager-accent/10'
                      : 'hover:bg-manager-main',
                  )}
                >
                  <span>
                    <span className="block text-sm font-medium text-manager-text">
                      {g.name}
                    </span>
                    <span className="block text-xs text-manager-text-muted">
                      Party of {g.partySize} · {g.dates}
                    </span>
                    {/* Distinguish a bill being run up now from one accruing
                        for a stay that hasn't started. */}
                    {!inResidenceIds.has(g.activeBookingId) && (
                      <span className="mt-0.5 inline-block rounded bg-[#f5ebe0] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8b6914]">
                        Upcoming
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* Folio detail */}
      <section className="rounded-xl border border-manager-border bg-manager-card">
        {!bookingId ? (
          <p className="p-8 text-center text-sm text-manager-text-muted">
            Select a guest to view their folio.
          </p>
        ) : folioLoading ? (
          <div className="space-y-3 p-6">
            <div className="h-8 w-48 animate-pulse rounded bg-manager-border" />
            <div className="h-40 animate-pulse rounded bg-manager-border" />
          </div>
        ) : !folio ? (
          <p className="p-8 text-center text-sm text-manager-text-muted">
            No folio for this booking.
          </p>
        ) : (
          <div className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-cormorant text-2xl text-manager-text">
                  {selectedGuest?.name ?? 'Folio'}
                </h2>
                <p className="text-sm text-manager-text-muted">
                  {folio.booking.nights} nights · {folio.booking.status}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setChargeOpen(true)}
                >
                  <Plus className="size-4" /> Log charge
                </Button>
                <Button
                  type="button"
                  className="gap-1.5 bg-manager-accent text-white hover:bg-manager-accent-muted"
                  disabled={folio.booking.status === 'CHECKED_OUT'}
                  onClick={() => setCheckoutOpen(true)}
                >
                  <Receipt className="size-4" />
                  {folio.booking.status === 'CHECKED_OUT'
                    ? 'Checked out'
                    : 'Checkout'}
                </Button>
              </div>
            </div>

            {/* Line items */}
            <div className="mt-5 divide-y divide-manager-border rounded-lg border border-manager-border">
              {folio.items.map((item) => {
                const editable = new Date(item.editableUntil) > new Date();
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-manager-text">
                        {item.description}
                        {item.quantity > 1 ? ` ×${item.quantity}` : ''}
                      </p>
                      <p className="text-xs text-manager-text-muted">
                        {item.type.replace(/_/g, ' ').toLowerCase()}
                        {item.attributedToName
                          ? ` · ${item.attributedToName}`
                          : ''}
                        {editable ? ' · editable 30m' : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums text-manager-text">
                        {money(item.amount * item.quantity)}
                      </span>
                      {editable ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditItem({
                              id: item.id,
                              description: item.description,
                              amount: item.amount,
                              quantity: item.quantity,
                            });
                            setEditAmount(String(item.amount));
                            setEditQty(String(item.quantity));
                          }}
                          className="text-xs font-medium text-manager-accent hover:underline"
                        >
                          Edit
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              {folio.items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-manager-text-muted">
                  No charges yet.
                </p>
              ) : null}
            </div>

            {/* Summary */}
            <div className="mt-5 ml-auto max-w-xs space-y-1.5 text-sm">
              <Row label="Subtotal" value={money(folio.summary.subtotal)} />
              <Row
                label={`Tax (${Math.round(folio.summary.taxRate * 100)}%)`}
                value={money(folio.summary.taxAmount)}
              />
              <Row
                label={`Service (${Math.round(folio.summary.serviceChargeRate * 100)}%)`}
                value={money(folio.summary.serviceAmount)}
              />
              <div className="flex items-center justify-between border-t border-manager-border pt-2 text-base font-semibold text-manager-text">
                <span>Grand total</span>
                <span className="tabular-nums">
                  {money(folio.summary.grandTotal)}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      <LogChargeDialog
        open={chargeOpen}
        onOpenChange={setChargeOpen}
        pending={addCharge.isPending}
        partyOptions={partyOptions}
        onSubmit={(dto) =>
          addCharge.mutate(dto, {
            onSuccess: () => {
              toast.success('Charge added');
              setChargeOpen(false);
            },
            onError: (e) => toast.error((e as Error).message),
          })
        }
      />

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit charge</DialogTitle>
            <DialogDescription>
              {editItem?.description} · editable within 30 minutes of logging.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block text-xs font-medium text-manager-text-muted">
              Amount (USD)
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="mt-1"
              />
            </label>
            <label className="block text-xs font-medium text-manager-text-muted">
              Quantity
              <Input
                type="number"
                min="1"
                step="1"
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
                className="mt-1"
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>
              Cancel
            </Button>
            <Button
              className="bg-manager-accent text-white hover:bg-manager-accent-muted"
              disabled={updateCharge.isPending || !Number(editAmount)}
              onClick={submitEdit}
            >
              {updateCharge.isPending ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm checkout</DialogTitle>
            <DialogDescription>
              This charges the card on file and emails the receipt. This cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          {folio ? (
            <div className="rounded-lg bg-manager-main px-4 py-3 text-sm">
              <div className="flex justify-between font-semibold text-manager-text">
                <span>Grand total</span>
                <span className="tabular-nums">
                  {money(folio.summary.grandTotal)}
                </span>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-manager-accent text-white hover:bg-manager-accent-muted"
              disabled={checkout.isPending}
              onClick={() =>
                checkout.mutate(undefined, {
                  onSuccess: () => {
                    toast.success('Checkout complete — receipt sent');
                    setCheckoutOpen(false);
                  },
                  onError: (e) => toast.error((e as Error).message),
                })
              }
            >
              {checkout.isPending ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : null}
              Confirm &amp; charge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-manager-text-muted">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function LogChargeDialog({
  open,
  onOpenChange,
  pending,
  onSubmit,
  partyOptions,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pending: boolean;
  onSubmit: (dto: CreateFolioItemDto) => void;
  partyOptions: PartyOption[];
}) {
  const [type, setType] = useState<FolioItemType>('INCIDENTAL');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [amount, setAmount] = useState('');
  const [staffNote, setStaffNote] = useState('');
  // Empty = unattributed, which falls to the primary in the by-guest breakdown.
  const [attributedTo, setAttributedTo] = useState('');

  const valid = description.trim() && Number(amount) > 0;
  const total = (Number(amount) || 0) * quantity;

  const submit = () => {
    if (!valid) return;
    const attributed = partyOptions.find((g) => g.email === attributedTo);
    onSubmit({
      type,
      description: description.trim(),
      amount: Number(amount),
      quantity,
      staffNote: staffNote.trim() || undefined,
      attributedToEmail: attributed?.email,
      attributedToName: attributed?.name,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log a charge</DialogTitle>
          <DialogDescription>Added to the guest folio.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {CHARGE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors',
                  type === t.value
                    ? 'border-manager-accent bg-manager-accent/10 text-manager-text'
                    : 'border-manager-border text-manager-text-muted hover:text-manager-text',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Input
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-24"
              placeholder="Qty"
            />
            <Input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Unit price"
            />
          </div>
          {partyOptions.length > 0 && (
            <div className="space-y-1.5">
              <label
                htmlFor="charge-attribution"
                className="text-xs font-medium text-manager-text-muted"
              >
                Charge to
              </label>
              <select
                id="charge-attribution"
                value={attributedTo}
                onChange={(e) => setAttributedTo(e.target.value)}
                className="h-9 w-full rounded-md border border-manager-border bg-manager-card px-2 text-sm text-manager-text"
              >
                <option value="">Unassigned — falls to the primary</option>
                {partyOptions.map((g) => (
                  <option key={g.email} value={g.email}>
                    {g.name}
                    {g.isPrimary ? ' (primary)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-manager-text-muted">
                Shows in the primary’s spend-by-guest breakdown so they can
                charge each guest independently.
              </p>
            </div>
          )}
          <Textarea
            placeholder="Audit note (optional)"
            value={staffNote}
            onChange={(e) => setStaffNote(e.target.value)}
            rows={2}
          />
          {total > 0 ? (
            <p className="text-right text-sm font-medium text-manager-text">
              Total {money(total)}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-manager-accent text-white hover:bg-manager-accent-muted"
            disabled={!valid || pending}
            onClick={submit}
          >
            {pending ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : null}
            Add charge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
