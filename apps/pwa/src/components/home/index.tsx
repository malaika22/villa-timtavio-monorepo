'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrivalStatusChip } from '../ArrivalStatusChip';
import { ArrivalStatus } from '@/types/arrivalStatus';
import { HeroCard } from './hero-card';
import { ArrivalCountdown } from '../ArrivalCountdown';
import { GuestManifestPrompt } from './guest-manifest/GuestManifestPrompt';
import { GuestDetailsCard } from './guest-manifest/GuestDetailsCard';
import { ApprovalsPromptCard } from './ApprovalsPromptCard';
import { GuestManifestForm } from '@/components/GuestManifestForm';
import type { GuestManifestFormValues } from '@/components/GuestManifestForm';
import { GuestAddedSheet } from '@/components/manifest/GuestAddedSheet';
import { TodaySchedule } from './today-schedule';
import { FeaturedExperiences } from '../featured-experiences';
import { RoomsExploreCard } from './rooms-explore/RoomsExploreCard';
import { DiningCard } from './dining/DiningCard';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentBooking } from '@/hooks/useBooking';
import { useManifest, useAddManifestGuest } from '@/hooks/useManifest';
import { usePendingApprovalRequests } from '@/hooks/useRequests';
import { useRoomAvailability } from '@/hooks/useRoomAvailability';
import { usePusherChannel } from '@/hooks/usePusherChannel';
import { useQueryClient } from '@tanstack/react-query';
import type { CreateManifestGuestDto } from '@repo/api-types';

function mapFormToDto(data: GuestManifestFormValues): CreateManifestGuestDto {
  const parts = data.fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? '',
    lastName: (parts.slice(1).join(' ') || parts[0]) ?? '',
    email: data.email,
    phone: data.phone || undefined,
    dateOfBirth: data.dateOfBirth || undefined,
    relationship: data.relationship,
    roomNumber: data.roomId ? parseInt(data.roomId, 10) : undefined,
    dietaryRestrictions: data.dietaryRestrictions,
    dietaryOtherDetails: data.dietaryRestrictions.includes('other')
      ? data.dietaryOtherDetails || undefined
      : undefined,
    allergies: data.foodAllergies || undefined,
    beveragePreferences: data.beveragePreferences || undefined,
    specialNotes: data.specialNotes || undefined,
  };
}

export const Home = () => {
  const { isAuthenticated, isPrimary, firstName, bookingId } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showAddedSheet, setShowAddedSheet] = useState(false);
  const [addedGuestName, setAddedGuestName] = useState('');

  useCurrentBooking();
  usePusherChannel(bookingId ?? null);

  const arrivalStatus = useBookingStore((s) => s.arrivalStatus);
  const manifestStatus = useBookingStore((s) => s.manifestStatus);
  const totalGuests = useBookingStore((s) => s.totalGuests);
  const { data: manifest, isError: manifestError } = useManifest();
  const { data: rooms } = useRoomAvailability();
  const { data: pendingApprovals = [] } = usePendingApprovalRequests();
  const addGuest = useAddManifestGuest();

  const displayArrivalStatus = arrivalStatus ?? ArrivalStatus.PRE_ARRIVAL;

  // Prefer the live manifest response; fall back to the booking store.
  const liveManifestStatus = manifest?.manifestStatus ?? manifestStatus;
  const guestsAdded = manifest?.addedGuests ?? 0;
  const maxGuests = manifest?.totalGuests ?? totalGuests ?? 16;
  const roomsUsed = manifest?.roomSummary?.filter(
    (r) => r.assignedGuests > 0,
  ).length;

  // Once the party has settled in, the manifest "prompt" is no longer relevant —
  // swap it for a read-only entry into the guest details.
  const isSettledOrLater =
    displayArrivalStatus === ArrivalStatus.SETTLED ||
    displayArrivalStatus === ArrivalStatus.DEPARTURE_TODAY ||
    displayArrivalStatus === ArrivalStatus.CHECKOUT_OUT;

  const handleSave = async (data: GuestManifestFormValues) => {
    const dto = mapFormToDto(data);
    await addGuest.mutateAsync(dto);
    void queryClient.invalidateQueries({
      queryKey: ['rooms', 'availability', bookingId],
    });
    setAddedGuestName(dto.firstName);
    setIsAddOpen(false);
    setShowAddedSheet(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <ArrivalStatusChip arrivalStatus={displayArrivalStatus} />
        {firstName && (
          <div className="flex flex-col items-end">
            <div className="text-[#2B2824] font-cormorant italic text-[18px] leading-none">
              {firstName}
            </div>
            <div className="text-[#797168] text-[7px] tracking-[2px] uppercase mt-[2px]">
              Your stay
            </div>
          </div>
        )}
      </div>
      <HeroCard />
      <ArrivalCountdown />
      {isAuthenticated &&
        (isSettledOrLater ? (
          <GuestDetailsCard guestsAdded={guestsAdded} roomsUsed={roomsUsed} />
        ) : (
          <GuestManifestPrompt
            loading={!manifest && !manifestError}
            manifestStatus={liveManifestStatus}
            guestsAdded={guestsAdded}
            maxGuests={maxGuests}
            roomsUsed={roomsUsed}
            onAddGuest={() => setIsAddOpen(true)}
          />
        ))}
      {isAuthenticated && isPrimary && (
        <ApprovalsPromptCard count={pendingApprovals.length} />
      )}
      <RoomsExploreCard
        roomCount={rooms?.length}
        previewImage={rooms?.find((r) => r.imageUrl)?.imageUrl}
      />
      <DiningCard />
      <div className="bg-[#E3E0DA] h-[1px]" />
      <TodaySchedule />
      <FeaturedExperiences />

      <GuestManifestForm
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCancel={() => setIsAddOpen(false)}
        onSave={handleSave}
        onRemoveGuest={() => setIsAddOpen(false)}
        rooms={rooms}
        bookingId={bookingId ?? undefined}
      />

      <GuestAddedSheet
        open={showAddedSheet}
        onClose={() => setShowAddedSheet(false)}
        guestFirstName={addedGuestName}
        addedGuests={manifest?.addedGuests ?? 0}
        totalGuests={totalGuests ?? 16}
        onAddAnother={() => {
          setShowAddedSheet(false);
          setTimeout(() => setIsAddOpen(true), 150);
        }}
        onViewManifest={() => {
          setShowAddedSheet(false);
          router.push('/manifest');
        }}
      />
    </div>
  );
};
