import { GuestDetailHeader } from '@/components/manager/pages/guests/GuestDetailHeader';
import { GuestDnaExtras } from '@/components/manager/pages/guests/GuestDnaExtras';
import { GuestPreferencesSection } from '@/components/manager/pages/guests/GuestPreferencesSection';
import { GuestStaffNotes } from '@/components/manager/pages/guests/GuestStaffNotes';
import { GuestStayActivityTable } from '@/components/manager/pages/guests/GuestStayActivityTable';
import { GuestStayHistoryTable } from '@/components/manager/pages/guests/GuestStayHistoryTable';
import type { GuestDNAProfile } from '@/types';

export const GuestDetailPanel = ({ profile }: { profile: GuestDNAProfile }) => (
  <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-[#f9f7f2]">
    <GuestDetailHeader profile={profile} />

    <div className="space-y-4 px-5 py-4 lg:px-6">
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
  </div>
);
