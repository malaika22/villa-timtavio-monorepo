import type { GuestDNAProfile } from '@/types';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
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

export const GuestPreferencesSection = ({ profile }: { profile: GuestDNAProfile }) => (
  <div>
    <Section title="Dietary & Restrictions">
      <TagList items={profile.dietary} />
    </Section>
    <Section title="Beverage Preferences">
      <TagList items={profile.beverage} />
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
              <dt className="w-24 shrink-0 text-manager-text-muted">{row.label}</dt>
              <dd className="font-medium text-manager-text">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </Section>
  </div>
);
