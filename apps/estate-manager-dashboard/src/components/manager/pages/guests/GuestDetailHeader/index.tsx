import { Mail } from 'lucide-react';
import { Button } from '@repo/ui';

import type { GuestDNAProfile } from '@/types';

export const GuestDetailHeader = ({ profile }: { profile: GuestDNAProfile }) => (
  <div className="flex shrink-0 flex-col gap-3 border-b border-[#ebe6df] bg-[#f9f7f2] px-5 py-4 sm:flex-row sm:items-start sm:justify-between lg:px-6">
    <div className="flex gap-3">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-manager-accent text-lg font-semibold tracking-wide text-white">
        {profile.initials}
      </span>
      <div>
        <h2 className="font-cormorant text-[26px] leading-tight font-normal text-manager-text">
          {profile.name}
        </h2>
        <p className="mt-0.5 text-sm text-manager-text-muted">{profile.summary}</p>
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
    <div className="flex shrink-0 items-center gap-2">
      <Button
        variant="outline"
        className="h-8 gap-1.5 rounded-md border-[#e5e0d8] bg-white px-3.5 text-[13px] font-medium text-manager-text shadow-none hover:bg-[#faf9f7]"
      >
        <Mail className="size-3.5 text-manager-text-muted" />
        Message
      </Button>
      <Button className="h-8 rounded-md border-0 bg-manager-accent px-3.5 text-[13px] font-medium text-white shadow-none hover:bg-manager-accent-muted">
        Add Note
      </Button>
    </div>
  </div>
);
