'use client';
import { useBookingStore } from '@/store/useBookingStore';
import { ArrivalStatus } from '@/types/arrivalStatus';

function getDaysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function getArrivalLabel(days: number): string {
  if (days === 0) return 'ARRIVING TODAY';
  if (days === 1) return 'ARRIVES TOMORROW';
  return `ARRIVES IN ${days} DAYS`;
}

// The pill reflects the actual stay phase — not just the check-in date — so a
// checked-in or departed guest never sees "arriving today".
function getStayLabel(
  arrivalStatus: ArrivalStatus | null,
  checkIn: string | null,
): string | null {
  switch (arrivalStatus) {
    case ArrivalStatus.CHECKOUT_OUT:
      // Stay is over — the hero already shows "Checked out"; no countdown.
      return null;
    case ArrivalStatus.CHECKED_IN:
    case ArrivalStatus.SETTLED:
      return 'IN VILLA';
    case ArrivalStatus.DEPARTURE_TODAY:
      return 'DEPARTING TODAY';
    default: {
      const days = getDaysUntil(checkIn);
      return days === null ? null : getArrivalLabel(days);
    }
  }
}

export const ArrivalCountdown = () => {
  const checkIn = useBookingStore((s) => s.checkIn);
  const arrivalStatus = useBookingStore((s) => s.arrivalStatus);
  const label = getStayLabel(arrivalStatus, checkIn);

  if (!label) return null;

  return (
    <div className="bg-[#CEC6B840] mx-auto border border-[#CEC6B8] w-fit rounded-[20px] text-[9px] py-[6px] px-[14px] text-[#5C3530] tracking-[1.26px] uppercase">
      <span className="rounded-full bg-[#5C3530] w-[5px] h-[5px] inline-block mr-2" />
      {label}
    </div>
  );
};
