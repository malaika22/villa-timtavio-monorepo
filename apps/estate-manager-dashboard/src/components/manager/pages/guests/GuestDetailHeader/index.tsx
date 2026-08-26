import { Sparkles } from 'lucide-react';

import { GuestQuickActions } from '@/components/manager/pages/guests/GuestQuickActions';
import type { GuestDNAProfile } from '@/types';

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export const GuestDetailHeader = ({
  profile,
}: {
  profile: GuestDNAProfile;
}) => (
  <div className="flex shrink-0 flex-col gap-3 border-b border-[#ebe6df] bg-[#f9f7f2] px-5 py-4 lg:px-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-3">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-manager-accent text-lg font-semibold tracking-wide text-white">
          {profile.initials}
        </span>
        <div>
          <h2 className="font-cormorant text-[26px] leading-tight font-normal text-manager-text">
            {profile.name}
          </h2>
          <p className="mt-0.5 text-sm text-manager-text-muted">
            {profile.summary}
          </p>
          {/* Both were on the record and neither was drawn, on a screen with a
              Magic link button that mails an address it would not show you. */}
          {(profile.email || profile.phone) && (
            <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-manager-text-muted">
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="underline decoration-[#e5e0d8] underline-offset-2 hover:text-manager-text"
                >
                  {profile.email}
                </a>
              )}
              {profile.email && profile.phone && <span>·</span>}
              {profile.phone && (
                <a
                  href={`tel:${profile.phone.replace(/[^+\d]/g, '')}`}
                  className="underline decoration-[#e5e0d8] underline-offset-2 hover:text-manager-text"
                >
                  {profile.phone}
                </a>
              )}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {profile.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#e5e0d8] bg-white px-3 py-1 text-sm font-medium text-manager-text"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      <GuestQuickActions profile={profile} />
    </div>

    {(profile.totalVisits ?? 0) > 1 ? (
      <div className="flex items-center gap-2 rounded-lg border border-[#e8dcc8] bg-[#fff5eb] px-3.5 py-2 text-sm text-[#8a5a12]">
        <Sparkles className="size-4 shrink-0 text-[#b45309]" />
        <span>
          <span className="font-semibold">
            {ordinal(profile.totalVisits ?? 0)} visit
          </span>{' '}
          · lifetime spend ${(profile.lifetimeSpend ?? 0).toLocaleString()}
        </span>
      </div>
    ) : null}
  </div>
);
