'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Drawer, DrawerContent, Input } from '@repo/ui';
import { cn } from '@repo/ui/lib/utils';
import { ArrowRight, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import {
  DIETARY_VALUES,
  type DietaryValue,
  type GuestManifestFormValues,
  guestManifestSchema,
  RELATIONSHIP_VALUES,
  type RelationshipValue,
  STEP1_TRIGGER_FIELDS,
} from './schema';
import {
  formatRoomSelectLabel,
  formatRoomSummary,
  isRoomFull,
  ROOM_OPTIONS,
} from './rooms';
import { Textarea } from '@repo/ui/components/textarea';

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

const DIETARY_LABEL: Record<DietaryValue, string> = {
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
};

export function GuestManifestForm({
  onCancel,
  onSave,
  onRemoveGuest,
  open,
  onClose,
}: GuestManifestFormProps) {
  const [uiStep, setUiStep] = useState<1 | 2>(1);

  const defaultValues = useMemo(
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

  const {
    control,
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<GuestManifestFormValues>({
    resolver: zodResolver(guestManifestSchema),
    defaultValues,
    mode: 'onTouched',
  });

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
    setValue('__step', 2);
    await onSave?.(data);
  });

  const toggleDietary = (
    current: DietaryValue[],
    value: DietaryValue,
  ): DietaryValue[] =>
    current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
  console.log(open);
  return (
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
          className="mx-auto max-w-md space-y-6 rounded-[10px]  bg-white px-[14px] py-5 shadow-[0_1px_2px_rgba(15,31,46,0.04)] h-full overflow-scroll"
          noValidate
        >
          {uiStep === 1 ? (
            <>
              <header className="space-y-3">
                <h1 className="font-cormorant text-[26px] font-medium italic leading-tight text-[#2B2824]">
                  Add a guest
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
                <label htmlFor="roomId" className={labelClass}>
                  Select room <span className="text-[#B42318]">*</span>
                </label>
                <select
                  id="roomId"
                  className={cn(
                    'w-full rounded-lg border border-[#E3E0DA] bg-white px-3 py-2.5 text-[12px] text-[#2B2824] placeholder:text-[#B0AAA0] outline-none transition-[border-color,box-shadow] focus-visible:border-[#0F1F2E] focus-visible:ring-1 focus-visible:ring-[#0F1F2E]/15',
                    'appearance-none bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-10',
                    errors.roomId && 'border-[#B42318]',
                  )}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23797168' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  }}
                  {...register('roomId')}
                >
                  <option value="">Choose a room…</option>
                  {ROOM_OPTIONS.map((room) => (
                    <option
                      key={room.id}
                      value={room.id}
                      disabled={isRoomFull(room)}
                    >
                      {formatRoomSelectLabel(room)}
                    </option>
                  ))}
                </select>
                {errors.roomId && (
                  <p className="mt-1 text-[10px] text-[#B42318]">
                    {errors.roomId.message}
                  </p>
                )}
                <p className="mt-2 text-[9px] leading-relaxed tracking-wide text-[#9A9288]">
                  {ROOM_OPTIONS.map((r) => formatRoomSummary(r)).join(' · ')}
                </p>
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
                      {DIETARY_VALUES.map((value) => {
                        const active = field.value.includes(value);
                        return (
                          <Button
                            key={value}
                            type="button"
                            aria-pressed={active}
                            onClick={() =>
                              field.onChange(toggleDietary(field.value, value))
                            }
                            className={cn(
                              'rounded-full border px-2.5 py-1.5 text-[10px] font-medium transition-colors',
                              active
                                ? 'border-[#3B6D11] bg-[#EAF3DE] text-[#2F5510]'
                                : 'border-[#E3E0DA] bg-white text-[#5C534A] hover:border-[#C9C4BC]',
                            )}
                          >
                            {DIETARY_LABEL[value]}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                />
                {showDietaryOther && (
                  <div className="mt-3">
                    <label htmlFor="dietaryOtherDetails" className={labelClass}>
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

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  className="h-11 w-full rounded-lg border border-[#0F1F2E] bg-[#0F1F2E] text-[13px] font-medium text-white hover:bg-[#1A3040] hover:text-white"
                >
                  Save guest
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
