'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
import { toast } from 'sonner';
import type { UpdateGuestDnaDto } from '@repo/api-types';
import type { GuestDNAProfile } from '@/types';

import { useUpdateGuestDna } from '@/hooks/useGuests';

/** Comma-separated in the box, an array on the wire. */
const toList = (v: string) =>
  v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * Correcting what the estate knows about a guest.
 *
 * The endpoint and its hook have existed all along and nothing called them, so
 * a profile could be read and never fixed — a wrong allergy stayed wrong, and
 * the only recourse was the database. Allergies especially: this is the record
 * the kitchen's run sheet quotes.
 */
export const EditGuestDnaDialog = ({
  profile,
  open,
  onOpenChange,
}: {
  profile: GuestDNAProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const update = useUpdateGuestDna();
  const [form, setForm] = useState<UpdateGuestDnaDto>({});
  const [dietary, setDietary] = useState('');
  const [favourites, setFavourites] = useState('');

  // Reseeded each opening: a half-typed allergy from the previous guest must
  // never be sitting in the box when the next one is opened.
  useEffect(() => {
    if (!open) return;
    const raw = profile.raw ?? {};
    setForm({
      allergies: raw.allergies ?? '',
      beveragePreferences: raw.beveragePreferences ?? '',
      winePreferences: raw.winePreferences ?? '',
      preferredTimes: raw.preferredTimes ?? '',
      specialOccasions: profile.specialOccasions ?? '',
      pillarPreferences: raw.pillarPreferences ?? '',
    });
    setDietary((raw.dietaryRestrictions ?? []).join(', '));
    setFavourites((raw.favouriteExperiences ?? []).join(', '));
  }, [open, profile]);

  const set = <K extends keyof UpdateGuestDnaDto>(
    key: K,
    value: UpdateGuestDnaDto[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const save = () =>
    update.mutate(
      {
        id: profile.id,
        dto: {
          ...form,
          dietaryRestrictions: toList(dietary),
          favouriteExperiences: toList(favourites),
        },
      },
      {
        onSuccess: () => {
          toast.success(`${profile.name}’s profile updated`);
          onOpenChange(false);
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {profile.name}’s profile</DialogTitle>
          <DialogDescription>
            This is what the chef&rsquo;s brief and the kitchen run sheet quote.
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-3">
          <div>
            <label className="text-xs font-medium text-[#b42318]">
              Allergies
            </label>
            <Input
              value={form.allergies ?? ''}
              onChange={(e) => set('allergies', e.target.value)}
              placeholder="Severe nut allergy"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-manager-text-muted">
              Dietary restrictions
            </label>
            <Input
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              placeholder="vegetarian, no_shellfish"
              className="mt-1"
            />
            <p className="mt-1 text-[11px] text-manager-text-muted">
              Comma-separated, using the same values as the guest&rsquo;s own
              manifest form — <code>vegan</code>, <code>gluten_free</code>,{' '}
              <code>no_nuts</code>.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-manager-text-muted">
                Beverages
              </label>
              <Input
                value={form.beveragePreferences ?? ''}
                onChange={(e) => set('beveragePreferences', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-manager-text-muted">
                Wine
              </label>
              <Input
                value={form.winePreferences ?? ''}
                onChange={(e) => set('winePreferences', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-manager-text-muted">
              Favourite experiences
            </label>
            <Input
              value={favourites}
              onChange={(e) => setFavourites(e.target.value)}
              placeholder="Sunset sail, Temazcal"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-manager-text-muted">
              Preferred times
            </label>
            <Input
              value={form.preferredTimes ?? ''}
              onChange={(e) => set('preferredTimes', e.target.value)}
              placeholder="Early riser — breakfast at 8"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-manager-text-muted">
              Special occasions
            </label>
            <Textarea
              rows={2}
              value={form.specialOccasions ?? ''}
              onChange={(e) => set('specialOccasions', e.target.value)}
              placeholder="Anniversary on the 14th"
              className="mt-1 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-manager-text-muted">
              Notes on what they come for
            </label>
            <Textarea
              rows={2}
              value={form.pillarPreferences ?? ''}
              onChange={(e) => set('pillarPreferences', e.target.value)}
              className="mt-1 text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-manager-border bg-white text-manager-text"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={save}
            disabled={update.isPending}
            className="bg-manager-accent text-white hover:opacity-90"
          >
            {update.isPending && (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            )}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
