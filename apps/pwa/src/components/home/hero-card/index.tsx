'use client';
import { useBookingStore } from '@/store/useBookingStore';
import { SkeletonText } from './SkeletonText';

function formatBookingDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export const HeroCard = () => {
  const { checkIn, checkOut, nights, totalGuests } = useBookingStore();
  const isLoading = !checkIn;

  return (
    <div className="bg-[#0F1F2E] rounded-[10px]">
      <div className="h-[90px] bg-[linear-gradient(160deg,_#1A3040_0%,_#0F1F2E_100%)] relative rounded-t-[10px]">
        <div className="flex items-center justify-between bg-[#ffffff14] text-[#ffffff80] rounded-[3px] px-[6px] py-[2px] text-[7px] tracking-[0.12em] absolute top-2 left-2">
          Villa TimTavio · Estate
        </div>
        <div className="italic bottom-[8px] absolute right-[10px] text-white font-cormorant text-[20px] tracking-[0.2em]">
          Villa TimTavio
        </div>
      </div>
      <div className="flex items-center px-[14px] py-[12px] justify-between">
        <div className="space-y-2">
          <div className="text-[#FFFFFF40] text-[8px] tracking-[3.08px]">
            CHECK-IN
          </div>
          {isLoading ? (
            <SkeletonText className="h-3 w-12" />
          ) : (
            <div className="text-[#FFFFFFA6] text-[12px]">
              {formatBookingDate(checkIn)}
            </div>
          )}
        </div>
        <div className="w-[1px] bg-[#FFFFFF14] self-stretch" />
        <div className="space-y-2">
          <div className="text-[#FFFFFF40] text-[8px] tracking-[3.08px]">
            CHECK-OUT
          </div>
          {isLoading ? (
            <SkeletonText className="h-3 w-12" />
          ) : (
            <div className="text-[#FFFFFFA6] text-[12px]">
              {formatBookingDate(checkOut)}
            </div>
          )}
        </div>
        <div className="w-[1px] bg-[#FFFFFF14] self-stretch" />
        <div className="space-y-2">
          <div className="text-[#FFFFFF40] text-[8px] tracking-[3.08px]">
            NIGHTS
          </div>
          {isLoading ? (
            <SkeletonText className="h-3 w-5" />
          ) : (
            <div className="text-[#FFFFFFA6] text-[12px]">{nights}</div>
          )}
        </div>
        <div className="w-[1px] bg-[#FFFFFF14] self-stretch" />
        <div className="space-y-2">
          <div className="text-[#FFFFFF40] text-[8px] tracking-[3.08px]">
            GUESTS
          </div>
          {isLoading ? (
            <SkeletonText className="h-3 w-5" />
          ) : (
            <div className="text-[#FFFFFFA6] text-[12px]">{totalGuests}</div>
          )}
        </div>
      </div>
    </div>
  );
};
