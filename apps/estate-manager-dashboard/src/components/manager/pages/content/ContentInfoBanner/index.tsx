import { Info } from 'lucide-react';

export const ContentInfoBanner = () => (
  <div className="flex gap-3 rounded-lg border border-[#c5dff5] bg-[#e8f4fc] px-4 py-3.5">
    <Info className="mt-0.5 size-4 shrink-0 text-[#1976d2]" strokeWidth={2} />
    <p className="font-inter text-sm leading-relaxed text-[#3d5a73]">
      <span className="font-medium">Included</span> items are complimentary for
      guests. <span className="font-medium">Chargeable</span> items appear with
      pricing and require guest confirmation before booking.
    </p>
  </div>
);
