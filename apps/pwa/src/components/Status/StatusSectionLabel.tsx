import { TABS } from './constants';
import { StatusSectionLabelProps } from './type';

export const StatusSectionLabel = ({ activeTab }: StatusSectionLabelProps) => {
  const sectionLabel = TABS.find((t) => t.id === activeTab)?.sectionLabel;

  if (!sectionLabel) return null;

  return (
    <p className="text-[8px] font-semibold uppercase tracking-[2px] text-[#9A9288]">
      {sectionLabel}
    </p>
  );
};
