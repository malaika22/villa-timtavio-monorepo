import { ArrivalStatus } from '@/types/arrivalStatus';

export const ARRIVAL_STATUS_CHIP_CONFIG = {
  [ArrivalStatus.PRE_ARRIVAL]: {
    label: 'Pre-Arrival',
    chipCss: 'bg-[#CEC6B84D] text-[#5C3530] border border-[#CEC6B8]',
    dotColor: 'bg-[#5C3530]',
  },
  [ArrivalStatus.CHECKED_IN]: {
    label: 'Checked-In',
    chipCss: 'bg-[#e6f1fb] text-[#185FA5] border border-[#185FA5]',
    dotColor: 'bg-[#378ADD]',
  },
  [ArrivalStatus.SETTLED]: {
    label: 'Settled',
    chipCss: 'bg-[#EAF3DE] text-[#3B6D11] border border-[#3B6D11]',
    dotColor: 'bg-[#639922]',
  },
  [ArrivalStatus.DEPARTURE_TODAY]: {
    label: 'Departure Today',
    chipCss: 'bg-[#FAEEDA] text-[#854F0B] border border-[#854F0B]',
    dotColor: 'bg-[#BA7517]',
  },
  [ArrivalStatus.CHECKOUT_OUT]: {
    label: 'Checked Out',
    chipCss: 'bg-[#F1EFE8] text-[#5F5E5A] border border-[#5F5E5A]',
    dotColor: 'bg-[#888780]',
  },
};
