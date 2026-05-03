import { Button } from '@repo/ui';
import { BellIcon, Phone } from 'lucide-react';
import Image from 'next/image';

export const Header = () => {
  return (
    <div className="min-h-[44px] flex items-center px-[14px] py-4 border-b border-[#E3E0DA] justify-between">
      <Image src="/images/dark-logo.svg" alt="Logo" width={100} height={100} />
      <div className="space-x-3">
        <Button className="rounded-full bg-timtavio-background border border-[#E3E0DA] w-[28px] h-[28px]">
          <BellIcon size={10} className="text-[#797168]" />
        </Button>
        <Button className="rounded-full bg-[#F5F3F0] border border-[#E3E0DA] w-[28px] h-[28px]">
          <Phone size={10} className="text-[#797168]" />
        </Button>
      </div>
    </div>
  );
};
