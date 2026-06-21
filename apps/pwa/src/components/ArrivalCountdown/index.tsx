'use client';
import { useBookingStore } from '@/store/useBookingStore';

function getDaysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getLabel(days: number): string {
  if (days < 0) return 'CHECKED IN';
  if (days === 0) return 'ARRIVING TODAY';
  if (days === 1) return 'ARRIVES TOMORROW';
  return `ARRIVES IN ${days} DAYS`;
}

export const ArrivalCountdown = () => {
  const checkIn = useBookingStore((s) => s.checkIn);
  const days = getDaysUntil(checkIn);

  if (days === null) return null;

  return (
    <div className="bg-[#CEC6B840] mx-auto border border-[#CEC6B8] w-fit rounded-[20px] text-[9px] py-[6px] px-[14px] text-[#5C3530] tracking-[1.26px] uppercase">
      <span className="rounded-full bg-[#5C3530] w-[5px] h-[5px] inline-block mr-2" />
      {getLabel(days)}
    </div>
  );
};
