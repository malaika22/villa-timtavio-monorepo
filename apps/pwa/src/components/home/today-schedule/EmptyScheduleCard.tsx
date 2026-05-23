import { Button } from '@repo/ui/components/button';

export const EmptyScheduleCard = () => {
  return (
    <div className="border border-dashed border-[#E3E0DA] rounded-lg p-4 space-y-2 text-center">
      <div className="font-cormorant italic text-[#797168] text-[14px]">
        Everything awaits your arrival
      </div>
      <div className="text-[#797168] text-[10px] font-light">
        Your schedule will appear once you check in.
      </div>
      <Button className="border border-[#E3E0DA] bg-white text-[#181818] uppercase text-[8px] font-medium w-[160px] h-[36px] tracking-[1.98px] font-[500] mt-1">
        Browse Experiences
      </Button>
    </div>
  );
};
