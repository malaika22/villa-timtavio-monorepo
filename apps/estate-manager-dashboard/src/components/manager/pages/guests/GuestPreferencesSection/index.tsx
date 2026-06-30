'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  useAddBeveragePreference,
  useAddDietaryRestriction,
} from '@/hooks/useCrmNotes';
import type { GuestDNAProfile } from '@/types';

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="mb-4 last:mb-0">
    <h3 className="mb-1.5 text-[10px] font-medium tracking-[0.14em] text-manager-text-muted uppercase">
      {title}
    </h3>
    {children}
  </div>
);

const TagList = ({ items }: { items: string[] }) => (
  <div className="flex flex-wrap gap-1.5">
    {items.length === 0 ? (
      <p className="text-sm text-manager-text-muted">None on file</p>
    ) : (
      items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-[#e5e0d8] bg-white px-3 py-1.5 text-sm text-manager-text"
        >
          {item}
        </span>
      ))
    )}
  </div>
);

const InlineAdd = ({
  placeholder,
  pending,
  onAdd,
}: {
  placeholder: string;
  pending: boolean;
  onAdd: (value: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-manager-accent hover:underline"
      >
        <Plus className="size-3" />
        Add preference
      </button>
    );
  }

  const submit = () => {
    const v = value.trim();
    if (!v) return;
    onAdd(v);
    setValue('');
    setOpen(false);
  };

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder={placeholder}
        className="h-8 flex-1 rounded-md border border-manager-border bg-white px-2.5 text-sm outline-none focus:border-manager-accent"
      />
      <button
        type="button"
        onClick={submit}
        disabled={pending || !value.trim()}
        className="flex h-8 items-center gap-1 rounded-md bg-manager-accent px-3 text-xs font-medium text-white disabled:opacity-50"
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
        Add
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-manager-text-muted"
      >
        Cancel
      </button>
    </div>
  );
};

export const GuestPreferencesSection = ({
  profile,
}: {
  profile: GuestDNAProfile;
}) => {
  const addBeverage = useAddBeveragePreference(profile.id);
  const addDietary = useAddDietaryRestriction(profile.id);

  return (
    <div>
      <Section title="Dietary & Restrictions">
        <TagList items={profile.dietary} />
        <InlineAdd
          placeholder="e.g. Gluten-free"
          pending={addDietary.isPending}
          onAdd={(v) =>
            addDietary.mutate(v, {
              onSuccess: () => toast.success('Dietary restriction added'),
              onError: (e) => toast.error((e as Error).message),
            })
          }
        />
      </Section>
      <Section title="Beverage Preferences">
        <TagList items={profile.beverage} />
        <InlineAdd
          placeholder="e.g. Oaxacan mezcal"
          pending={addBeverage.isPending}
          onAdd={(v) =>
            addBeverage.mutate(v, {
              onSuccess: () => toast.success('Beverage preference added'),
              onError: (e) => toast.error((e as Error).message),
            })
          }
        />
      </Section>
      <Section title="Experience Preferences">
        <TagList items={profile.experiencePrefs} />
      </Section>
      <Section title="Room Setup">
        {profile.roomSetup.length === 0 ? (
          <p className="text-sm text-manager-text-muted">None on file</p>
        ) : (
          <dl className="space-y-2">
            {profile.roomSetup.map((row) => (
              <div key={row.label} className="flex gap-3 text-sm">
                <dt className="w-24 shrink-0 text-manager-text-muted">
                  {row.label}
                </dt>
                <dd className="font-medium text-manager-text">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Section>
    </div>
  );
};
