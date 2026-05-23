import { ReportsProgressList } from '@/components/manager/pages/reports/ReportsProgressList';
import { reportsExperiencePopularity } from '@/lib/reports-mock-data';

export const ReportsExperiencePopularityCard = () => (
  <section className="flex h-full flex-col">
    <h3 className="font-cormorant mb-3 shrink-0 text-[22px] leading-tight text-manager-text">
      Experience Popularity
    </h3>
    <div className="flex flex-1 flex-col rounded-xl border border-[#e8e4de] bg-white p-5 shadow-[0_1px_3px_rgba(26,22,20,0.06)]">
      <ReportsProgressList rows={reportsExperiencePopularity} />
    </div>
  </section>
);
