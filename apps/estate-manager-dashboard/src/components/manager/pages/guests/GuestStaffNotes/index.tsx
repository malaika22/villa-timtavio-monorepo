'use client';

import { useState } from 'react';

import { useCrmNotes, useAddCrmNote } from '@/hooks/useCrmNotes';
import type { GuestDNAProfile } from '@/types';

export const GuestStaffNotes = ({ profile }: { profile: GuestDNAProfile }) => {
  const { data: notes, isLoading } = useCrmNotes(profile.id);
  const addNote = useAddCrmNote(profile.id);
  const [draft, setDraft] = useState('');

  const displayNote = notes?.[0] ?? null;

  const handleSubmit = async () => {
    const text = draft.trim();
    if (!text) return;
    await addNote.mutateAsync(text);
    setDraft('');
  };

  return (
    <section className="rounded-lg border border-[#e8dcc8] bg-[#fff5eb] p-3.5">
      <h3 className="mb-2 text-[10px] font-medium tracking-[0.14em] text-manager-text-muted uppercase">
        Staff Notes
      </h3>

      {isLoading ? (
        <p className="text-sm text-manager-text-muted">Loading notes…</p>
      ) : displayNote ? (
        <>
          <p className="text-sm leading-relaxed text-manager-text">
            {displayNote.isStale
              ? `[Stale] ${displayNote.note}`
              : displayNote.note}
          </p>
          <p className="mt-2 text-sm text-manager-text-muted">
            Added by {displayNote.addedBy} ·{' '}
            {new Date(displayNote.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </>
      ) : (
        <p className="text-sm leading-relaxed text-manager-text">
          {profile.staffNote.text}
        </p>
      )}

      <div className="mt-3 space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a staff note…"
          rows={3}
          className="w-full resize-none rounded-md border border-[#e5e0d8] bg-white px-3 py-2 text-sm text-manager-text outline-none focus:border-manager-text"
        />
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={addNote.isPending || !draft.trim()}
          className="rounded-md bg-manager-text px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-white disabled:opacity-50"
        >
          {addNote.isPending ? 'Saving…' : 'Add note'}
        </button>
      </div>
    </section>
  );
};
