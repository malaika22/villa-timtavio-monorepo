'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/ui/components/button';
import { Drawer, DrawerContent } from '@repo/ui/components/drawer';
import { Input } from '@repo/ui/components/input';
import { cn } from '@repo/ui/lib/utils';
import { AlertTriangle, ArrowRight, Loader2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useBookingStore } from '@/store/useBookingStore';
import {
  DIETARY_VALUES,
  type GuestManifestFormValues,
  guestManifestSchema,
  RELATIONSHIP_VALUES,
  type RelationshipValue,
  STEP1_TRIGGER_FIELDS,
} from './schema';
import { ROOM_OPTIONS, type RoomOption } from './rooms';
import { RoomPicker } from './RoomPicker';
import { RoomDetailSheet } from '@/components/manifest/RoomDetailSheet';
import { Textarea } from '@repo/ui/components/textarea';
import type { RoomWithAvailability } from '@repo/api-types';
import { useDraftGuest } from '@/hooks/useDraftGuest';
import { useManifestOptions } from '@/hooks/useManifestOptions';

const inputClass = 'text-[12px]';

const labelClass =
  'mb-1.5 block text-[8px] font-medium uppercase tracking-[3.08px] text-[#797168]';

const sectionTitleClass =
  'mb-3 font-cormorant text-[15px] font-medium italic text-[#2B2824]';

const RELATIONSHIP_LABEL: Record<RelationshipValue, string> = {
  partner: 'Partner',
  family: 'Family',
  friend: 'Friend',
  colleague: 'Colleague',
  other: 'Other',
};

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

function firstName(fullName: string): string {
  const t = fullName.trim();
  if (!t) return 'Guest';
  return t.split(/\s+/)[0] ?? 'Guest';
}

type GuestManifestFormProps = {
  open: boolean;
  onClose: () => void;
  onCancel?: () => void;
  onSave?: (data: GuestManifestFormValues) => void | Promise<void>;
  onRemoveGuest?: () => void;
  rooms?: RoomWithAvailability[];
  /** If provided, form opens prefilled (edit mode) */
  initialValues?: GuestManifestFormValues;
  /** Set when editing an existing guest */
  guestId?: string;
  /** Button label override for step 2 submit */
  submitLabel?: string;
  /** Needed for draft autosave (add mode only) */
  bookingId?: string;
};

export function GuestManifestForm({
  onCancel,
  onSave,
  onRemoveGuest,
  open,
  onClose,
  rooms: livRooms,
  initialValues,
  guestId,
  submitLabel = 'Save guest',
  bookingId,
}: GuestManifestFormProps) {
  const roomOptions: RoomOption[] = livRooms
    ? livRooms.map((r) => ({
        id: r.number.toString(),
        name: `Room ${r.number}`,
        suiteLabel: r.name,
        filled: r.capacity - r.availableCapacity,
        capacity: r.capacity,
        bedConfig: r.bedConfig,
        totalBeds: (r.beds ?? []).reduce((sum, b) => sum + b.count, 0),
        bathrooms: r.bathrooms,
      }))
    : ROOM_OPTIONS;

  // Room detail sheet (only available when we have live room data)
  const [detailRoomId, setDetailRoomId] = useState<string | null>(null);
  const detailRoom =
    livRooms?.find((r) => r.number.toString() === detailRoomId) ?? null;

  // Use the booking store as the authoritative source (populated by useCurrentBooking)
  const storeBookingId = useBookingStore((s) => s.bookingId);
  const resolvedBookingId = bookingId ?? storeBookingId ?? null;

  // Draft (only in add mode, and only while the drawer is open)
  const draftBookingId = open && !guestId ? resolvedBookingId : null;

  const {
    query: draftQuery,
    upsert: draftUpsert,
    clear: draftClear,
  } = useDraftGuest(draftBookingId);
  const { data: manifestOptions } = useManifestOptions(open);

  const dietaryOptions =
    manifestOptions?.dietaryRestrictions ??
    DIETARY_VALUES.map((v) => ({ value: v, label: DIETARY_LABEL[v] ?? v }));

  const [uiStep, setUiStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Guards a late autosave from re-creating a draft we just cleared on submit
  const submittedRef = useRef(false);

  const BLANK: GuestManifestFormValues = useMemo(
    (): GuestManifestFormValues => ({
      __step: 1,
      fullName: '',
      email: '',
      phone: '',
      relationship: 'family',
      dateOfBirth: '',
      roomId: '',
      dietaryRestrictions: [],
      dietaryOtherDetails: '',
      foodAllergies: '',
      beveragePreferences: '',
      specialNotes: '',
    }),
    [],
  );

  const initialValuesRef = useRef(initialValues);
  initialValuesRef.current = initialValues;

  const draftDataRef = useRef(draftQuery.data);
  draftDataRef.current = draftQuery.data;

  // Tracks whether we've already seeded the form from draft data this open cycle.
  // Prevents re-applying on every autosave write-back (which also updates draftQuery.data).
  const hasAppliedDraftRef = useRef(false);

  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const {
    control,
    register,
    handleSubmit,
    setValue,
    trigger,
    reset,
    formState: { errors },
  } = useForm<GuestManifestFormValues>({
    resolver: zodResolver(guestManifestSchema),
    defaultValues: BLANK,
    mode: 'onTouched',
  });

  // Watch all fields — useWatch re-renders this component on every field change
  const allValues = useWatch({ control });

  // Refs so timer callbacks always read the latest values
  const draftUpsertRef = useRef(draftUpsert);
  draftUpsertRef.current = draftUpsert;
  const allValuesRef = useRef(allValues);
  allValuesRef.current = allValues;

  // Reset form whenever the drawer opens.
  // Draft data may not have loaded yet — the effect below handles applying it once it arrives.
  useEffect(() => {
    if (!open) return;
    submittedRef.current = false;
    hasAppliedDraftRef.current = false;
    setSubmitError(null);
    setSubmitting(false);
    if (initialValuesRef.current) {
      // Edit mode: prefill immediately and mark draft as not needed
      reset(initialValuesRef.current);
      hasAppliedDraftRef.current = true;
    } else {
      reset(BLANK);
    }
    setUiStep(1);
  }, [open, reset, BLANK]);

  // Apply draft data once it loads — this fires after the query resolves,
  // which is always after the open effect above (async fetch).
  useEffect(() => {
    if (
      !open ||
      hasAppliedDraftRef.current ||
      submittedRef.current ||
      !draftQuery.data?.data ||
      Object.keys(draftQuery.data.data).length === 0
    )
      return;
    hasAppliedDraftRef.current = true;
    reset({
      ...BLANK,
      ...(draftQuery.data.data as Partial<GuestManifestFormValues>),
    });
  }, [open, draftQuery.data, reset, BLANK]);

  // Autosave: JSON.stringify gives reliable string comparison — fires whenever any field changes
  const draftKey =
    open && !guestId && draftBookingId ? JSON.stringify(allValues) : null;

  useEffect(() => {
    if (!draftKey) return;
    const timer = setTimeout(() => {
      if (submittedRef.current) return; // don't resurrect a cleared draft
      void draftUpsertRef.current.mutate({
        data: allValuesRef.current as Record<string, unknown>,
      });
    }, 800);
    autosaveTimerRef.current = timer;
    return () => clearTimeout(timer);
  }, [draftKey]);

  const fullName = useWatch({ control, name: 'fullName' }) ?? '';
  const dietaryRestrictions =
    useWatch({ control, name: 'dietaryRestrictions' }) ?? [];
  const showDietaryOther = dietaryRestrictions.includes('other');

  const continueToStep2 = async () => {
    setValue('__step', 1);
    const ok = await trigger([...STEP1_TRIGGER_FIELDS]);
    if (!ok) return;
    setValue('__step', 2);
    setUiStep(2);
  };

  const goBackToStep1 = () => {
    setValue('__step', 1);
    setUiStep(1);
  };

  const onSubmit = handleSubmit(async (data: GuestManifestFormValues) => {
    if (submitting) return; // guard against double-submit
    setValue('__step', 2);
    setSubmitError(null);
    setSubmitting(true);

    // Stop any pending autosave and block a late one from re-creating the draft
    submittedRef.current = true;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    try {
      await onSave?.(data);
      // Clear draft after successful save (add mode only)
      if (!guestId && draftBookingId) {
        void draftClear.mutate(undefined);
      }
    } catch (err) {
      // Re-enable autosave so the user's edits aren't lost on a failed save
      submittedRef.current = false;
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while saving. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  });

  const toggleDietary = (current: string[], value: string): string[] =>
    current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
  return (
    <>
      <Drawer open={open} onOpenChange={onClose}>
        <DrawerContent className="min-h-screen">
          <Button
            className="absolute right-2 top-3"
            variant="ghost"
            onClick={onClose}
          >
            <X />
          </Button>
          <form
            onSubmit={onSubmit}
            className="max-w-md space-y-6 rounded-[10px]  bg-white px-[24px] py-5 shadow-[0_1px_2px_rgba(15,31,46,0.04)] h-full overflow-scroll"
            noValidate
          >
            {uiStep === 1 ? (
              <>
                <header className="space-y-3">
                  <h1 className="font-cormorant text-[26px] font-medium italic leading-tight text-[#2B2824]">
                    {guestId ? 'Edit guest' : 'Add a guest'}
                  </h1>
                  <StepProgress current={1} />
                  <p className="text-[10px] uppercase tracking-[2.8px] text-[#797168]">
                    Step 1 of 2 — About this guest
                  </p>
                </header>

                <section>
                  <h2 className={sectionTitleClass}>Contact details</h2>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="fullName" className={labelClass}>
                        Full name <span className="text-[#B42318]">*</span>
                      </label>
                      <Input
                        id="fullName"
                        type="text"
                        autoComplete="name"
                        className={cn(
                          inputClass,
                          errors.fullName && 'border-[#B42318]',
                        )}
                        {...register('fullName')}
                      />
                      {errors.fullName && (
                        <p className="mt-1 text-[10px] text-[#B42318]">
                          {errors.fullName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="email" className={labelClass}>
                        Email address <span className="text-[#B42318]">*</span>
                      </label>
                      <Input
                        id="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        className={cn(
                          inputClass,
                          errors.email && 'border-[#B42318]',
                        )}
                        {...register('email')}
                      />
                      {errors.email && (
                        <p className="mt-1 text-[10px] text-[#B42318]">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="phone" className={labelClass}>
                        Phone number{' '}
                        <span className="text-[#797168]">(optional)</span>
                      </label>
                      <Input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="+1 (555) 000-0000"
                        {...register('phone')}
                        className={cn(inputClass)}
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className={sectionTitleClass}>Relationship to party</h2>
                  <Controller
                    name="relationship"
                    control={control}
                    render={({ field }) => (
                      <div
                        className="flex flex-wrap gap-2"
                        role="radiogroup"
                        aria-label="Relationship to primary member"
                      >
                        {RELATIONSHIP_VALUES.map((value) => (
                          <Button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={field.value === value}
                            onClick={() => field.onChange(value)}
                            className={cn(
                              'rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors',
                              field.value === value
                                ? 'border-[#0F1F2E] bg-[#0F1F2E] text-white'
                                : 'border-[#E3E0DA] bg-white text-[#5C534A] hover:border-[#C9C4BC]',
                            )}
                          >
                            {RELATIONSHIP_LABEL[value]}
                          </Button>
                        ))}
                      </div>
                    )}
                  />
                  {errors.relationship && (
                    <p className="mt-2 text-[10px] text-[#B42318]">
                      {errors.relationship.message}
                    </p>
                  )}
                </section>

                <section>
                  <h2 className={sectionTitleClass}>
                    Date of birth{' '}
                    <span className="text-[11px] font-normal not-italic text-[#797168]">
                      (optional)
                    </span>
                  </h2>
                  <label htmlFor="dateOfBirth" className={labelClass}>
                    Birthday
                  </label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register('dateOfBirth')}
                    className={cn(inputClass)}
                  />
                </section>

                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={continueToStep2}
                    className="h-11 w-full gap-2 rounded-lg border border-[#0F1F2E] bg-[#0F1F2E] text-[13px] font-medium text-white hover:bg-[#1A3040] hover:text-white"
                  >
                    Continue
                    <ArrowRight className="size-4 shrink-0" aria-hidden />
                  </Button>
                  {onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      className="h-11 w-full rounded-lg border-[#E3E0DA] bg-white text-[13px] font-medium text-[#2B2824] hover:bg-[#F5F3F0]"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <header className="space-y-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={goBackToStep1}
                    className="text-[10px] font-medium uppercase tracking-[2.4px] text-[#797168] underline-offset-2 hover:underline"
                  >
                    ← Edit guest details
                  </Button>
                  <h1 className="font-cormorant text-[26px] font-medium italic leading-tight text-[#2B2824]">
                    Room + preferences
                  </h1>
                  <StepProgress current={2} />
                  <p className="text-[10px] uppercase tracking-[2.8px] text-[#797168]">
                    Step 2 of 2 — {firstName(fullName)}
                  </p>
                </header>

                <section>
                  <h2 className={sectionTitleClass}>Room assignment</h2>
                  <label className={labelClass}>
                    Select room <span className="text-[#B42318]">*</span>
                  </label>
                  <Controller
                    name="roomId"
                    control={control}
                    render={({ field }) => (
                      <RoomPicker
                        rooms={roomOptions}
                        value={field.value}
                        onChange={field.onChange}
                        onShowDetails={
                          livRooms ? (id) => setDetailRoomId(id) : undefined
                        }
                      />
                    )}
                  />
                  {errors.roomId && (
                    <p className="mt-2 text-[10px] text-[#B42318]">
                      {errors.roomId.message}
                    </p>
                  )}
                </section>

                <section>
                  <h2 className={sectionTitleClass}>Dietary restrictions</h2>
                  <p className="mb-3 text-[10px] leading-snug text-[#797168]">
                    Select all that apply.
                  </p>
                  <Controller
                    name="dietaryRestrictions"
                    control={control}
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2">
                        {dietaryOptions.map(({ value, label }) => {
                          const active = (field.value as string[]).includes(
                            value,
                          );
                          return (
                            <Button
                              key={value}
                              type="button"
                              aria-pressed={active}
                              onClick={() =>
                                field.onChange(
                                  toggleDietary(field.value as string[], value),
                                )
                              }
                              className={cn(
                                'rounded-full border px-2.5 py-1.5 text-[10px] font-medium transition-colors',
                                active
                                  ? 'border-[#3B6D11] bg-[#EAF3DE] text-[#2F5510]'
                                  : 'border-[#E3E0DA] bg-white text-[#5C534A] hover:border-[#C9C4BC]',
                              )}
                            >
                              {label}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  />
                  {showDietaryOther && (
                    <div className="mt-3">
                      <label
                        htmlFor="dietaryOtherDetails"
                        className={labelClass}
                      >
                        Describe &quot;other&quot; restriction{' '}
                        <span className="text-[#B42318]">*</span>
                      </label>
                      <Textarea
                        id="dietaryOtherDetails"
                        rows={2}
                        className={cn(
                          inputClass,
                          'resize-y',
                          errors.dietaryOtherDetails && 'border-[#B42318]',
                        )}
                        placeholder="e.g. Low-FODMAP, pescatarian…"
                        {...register('dietaryOtherDetails')}
                      />
                      {errors.dietaryOtherDetails && (
                        <p className="mt-1 text-[10px] text-[#B42318]">
                          {errors.dietaryOtherDetails.message}
                        </p>
                      )}
                    </div>
                  )}
                </section>

                <section>
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="inline-block size-1.5 shrink-0 rounded-full bg-[#B42318]"
                      aria-hidden
                    />
                    <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#9F2D24]">
                      Allergy — medically important
                    </span>
                  </div>
                  <label htmlFor="foodAllergies" className={labelClass}>
                    Food allergies
                  </label>
                  <Textarea
                    id="foodAllergies"
                    rows={3}
                    className={cn(
                      inputClass,
                      'resize-y border-[#E8B4A8] bg-[#FEF6F4] placeholder:text-[#A67C72]',
                    )}
                    placeholder="e.g. Severe nut allergy — carries EpiPen."
                    {...register('foodAllergies')}
                  />
                  <p className="mt-1.5 text-[9px] leading-snug text-[#9A6B62]">
                    Separate from dietary preferences. Include severity and
                    emergency meds if applicable.
                  </p>
                </section>

                <section>
                  <h2 className={sectionTitleClass}>Beverage preferences</h2>
                  <label htmlFor="beveragePreferences" className={labelClass}>
                    Optional
                  </label>
                  <Textarea
                    id="beveragePreferences"
                    rows={2}
                    className={cn(inputClass, 'resize-y')}
                    placeholder="e.g. Prefers red wine, mezcal, non-alcoholic."
                    {...register('beveragePreferences')}
                  />
                </section>

                <section>
                  <h2 className={sectionTitleClass}>Special notes</h2>
                  <label htmlFor="specialNotes" className={labelClass}>
                    Optional
                  </label>
                  <Textarea
                    id="specialNotes"
                    rows={2}
                    className={cn(inputClass, 'resize-y')}
                    placeholder="e.g. Celebrating birthday Mar 22, requires ground floor room."
                    {...register('specialNotes')}
                  />
                </section>

                <AnimatePresence>
                  {submitError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -6, height: 0 }}
                      className="flex items-start gap-2 rounded-lg border border-[#E8B4A8] bg-[#FEF6F4] px-3 py-2.5"
                      role="alert"
                    >
                      <AlertTriangle
                        className="mt-[1px] size-3.5 shrink-0 text-[#B42318]"
                        aria-hidden
                      />
                      <p className="text-[10.5px] leading-snug text-[#9F2D24]">
                        {submitError}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-11 w-full gap-2 rounded-lg border border-[#0F1F2E] bg-[#0F1F2E] text-[13px] font-medium text-white hover:bg-[#1A3040] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting && (
                      <Loader2
                        className="size-4 shrink-0 animate-spin"
                        aria-hidden
                      />
                    )}
                    {submitting ? 'Saving…' : submitLabel}
                  </Button>
                  {onRemoveGuest && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onRemoveGuest}
                      className="text-center text-[12px] font-medium text-[#B42318] underline-offset-2 hover:underline"
                    >
                      Remove this guest
                    </Button>
                  )}
                </div>
              </>
            )}
          </form>
        </DrawerContent>
      </Drawer>

      <RoomDetailSheet
        open={!!detailRoom}
        onClose={() => setDetailRoomId(null)}
        room={detailRoom}
      />
    </>
  );
}

function StepProgress({ current }: { current: 1 | 2 }) {
  return (
    <div className="flex gap-1.5" aria-hidden>
      <div
        className={cn(
          'h-1 flex-1 rounded-full transition-colors',
          current >= 1 ? 'bg-[#0F1F2E]' : 'bg-[#E3E0DA]',
        )}
      />
      <div
        className={cn(
          'h-1 flex-1 rounded-full transition-colors',
          current >= 2 ? 'bg-[#0F1F2E]' : 'bg-[#E3E0DA]',
        )}
      />
    </div>
  );
}

export type { GuestManifestFormValues } from './schema';
