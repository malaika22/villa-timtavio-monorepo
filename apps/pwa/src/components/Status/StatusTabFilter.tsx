import { cn } from '@repo/ui/lib/utils';
import { TABS } from './constants';
import { StatusTabFilterProps } from './type';

export const StatusTabFilter = ({
  activeTab,
  setActiveTab,
}: StatusTabFilterProps) => {
  return (
    <div className="flex rounded-xl bg-[#EDEBE6] p-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            'flex-1 rounded-[9px] py-2 text-[9px] font-semibold uppercase tracking-[1.4px] transition-all duration-200',
            activeTab === tab.id
              ? 'bg-white text-[#1A1A18] shadow-sm'
              : 'text-[#9A9288]',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
