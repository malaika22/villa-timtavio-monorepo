'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrivalStatusChip } from '../ArrivalStatusChip';
import { ArrivalStatus } from '@/types/arrivalStatus';
import { HeroCard } from './hero-card';
import { ArrivalCountdown } from '../ArrivalCountdown';
import { GuestManifestPrompt } from './guest-manifest/GuestManifestPrompt';
import { GuestManifestForm } from '@/components/GuestManifestForm';
import type { GuestManifestFormValues } from '@/components/GuestManifestForm';
import { GuestAddedSheet } from '@/components/manifest/GuestAddedSheet';
import { TodaySchedule } from './today-schedule';
import { FeaturedExperiences } from '../featured-experiences';
import { RoomsExploreCard } from './rooms-explore/RoomsExploreCard';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentBooking } from '@/hooks/useBooking';
import { useManifest, useAddManifestGuest } from '@/hooks/useManifest';
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
  const { isAuthenticated, firstName, bookingId } = useAuth();
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
  const { data: manifest } = useManifest();
  const { data: rooms } = useRoomAvailability();
  const addGuest = useAddManifestGuest();

  const displayArrivalStatus = arrivalStatus ?? ArrivalStatus.PRE_ARRIVAL;

  const handleSave = async (data: GuestManifestFormValues) => {
    const dto = mapFormToDto(data);
    await addGuest.mutateAsync(dto);
    void queryClient.invalidateQueries({ queryKey: ['rooms', 'availability', bookingId] });
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
      {isAuthenticated && manifestStatus !== 'APPROVED' && (
        <GuestManifestPrompt
          guestsAdded={manifest?.addedGuests ?? 0}
          maxGuests={totalGuests ?? 16}
          onAddGuest={() => setIsAddOpen(true)}
        />
      )}
      <RoomsExploreCard
        roomCount={rooms?.length}
        previewImage={rooms?.find((r) => r.imageUrl)?.imageUrl}
      />
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
