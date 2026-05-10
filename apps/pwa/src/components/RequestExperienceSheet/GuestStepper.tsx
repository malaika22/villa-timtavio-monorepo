import { Minus, Plus } from 'lucide-react';
import { GuestStepperProps } from './types';

export const GuestStepper = ({ count, max, onChange }: GuestStepperProps) => {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        disabled={count <= 1}
        onClick={() => onChange(Math.max(1, count - 1))}
        className="flex size-10 items-center justify-center rounded-full border border-[#E3E0DA] text-[#2B2824] transition-colors disabled:cursor-not-allowed disabled:text-[#D0CBC3]"
      >
        <Minus className="size-4" strokeWidth={1.75} />
      </button>

      <span className="min-w-[1.5ch] text-center text-[22px] font-medium text-[#2B2824]">
        {count}
      </span>

      <button
        type="button"
        disabled={count >= max}
        onClick={() => onChange(Math.min(max, count + 1))}
        className="flex size-10 items-center justify-center rounded-full border border-[#E3E0DA] text-[#2B2824] transition-colors disabled:cursor-not-allowed disabled:text-[#D0CBC3]"
      >
        <Plus className="size-4" strokeWidth={1.75} />
      </button>

      <span className="text-[10px] font-medium uppercase tracking-[2px] text-[#797168]">
        of max {max} guests
      </span>
    </div>
  );
};
