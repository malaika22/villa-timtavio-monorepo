import type { GuestDNAProfile } from '@/types';

export const GuestStaffNotes = ({ profile }: { profile: GuestDNAProfile }) => (
  <section className="rounded-lg border border-[#e8dcc8] bg-[#fff5eb] p-3.5">
    <h3 className="mb-2 text-[10px] font-medium tracking-[0.14em] text-manager-text-muted uppercase">
      Staff Notes
    </h3>
    <p className="text-sm leading-relaxed text-manager-text">{profile.staffNote.text}</p>
    <p className="mt-2 text-sm text-manager-text-muted">
      Added by {profile.staffNote.author} · {profile.staffNote.date}
    </p>
  </section>
);
