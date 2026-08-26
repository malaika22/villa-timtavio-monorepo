'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@repo/ui';

import { GuestDetailHeader } from '@/components/manager/pages/guests/GuestDetailHeader';
import { EditGuestDnaDialog } from '@/components/manager/pages/guests/EditGuestDnaDialog';
import { GuestDnaExtras } from '@/components/manager/pages/guests/GuestDnaExtras';
import { GuestPreferencesSection } from '@/components/manager/pages/guests/GuestPreferencesSection';
import { GuestStaffNotes } from '@/components/manager/pages/guests/GuestStaffNotes';
import { GuestStayBand } from '@/components/manager/pages/guests/GuestStayBand';
import { GuestStayActivityTable } from '@/components/manager/pages/guests/GuestStayActivityTable';
import { GuestStayHistoryTable } from '@/components/manager/pages/guests/GuestStayHistoryTable';
import type { GuestDNAProfile } from '@/types';

export const GuestDetailPanel = ({ profile }: { profile: GuestDNAProfile }) => {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-[#f9f7f2]">
      <GuestDetailHeader profile={profile} />
      {/* Directly under the name: the stay is the reason this screen is open. */}
      <GuestStayBand profile={profile} />

      <div className="space-y-4 px-5 py-4 lg:px-6">
        {/* Read-only until now: a wrong allergy stayed wrong, and this is the
          record the kitchen's run sheet quotes. */}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setEditing(true)}
            className="border-manager-border bg-white text-manager-text"
          >
            <Pencil className="mr-1.5 size-3.5" />
            Edit profile
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-6">
          <GuestPreferencesSection profile={profile} />
          <div className="space-y-4">
            <GuestStaffNotes profile={profile} />
            <GuestStayActivityTable profile={profile} />
          </div>
        </div>

        <GuestDnaExtras profile={profile} />

        <GuestStayHistoryTable profile={profile} />
      </div>

      <EditGuestDnaDialog
        profile={profile}
        open={editing}
        onOpenChange={setEditing}
      />
    </div>
  );
};
