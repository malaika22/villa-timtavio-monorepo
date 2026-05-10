import { ExperienceStatus } from '@/types/experienceStatus';
import { RequestExperienceButton } from './RequestExperienceButton';
import { ExperienceStatusChip } from '../ExperienceStatusChip';

export const ActionStrip = ({
  experienceStatus,
}: {
  experienceStatus: ExperienceStatus;
}) => {
  if (experienceStatus === ExperienceStatus.LOCKED_PRE_ARRIVAL) {
    return (
      <p className="text-center text-[8px] font-medium uppercase tracking-[3.08px] text-[#797168]">
        Available at check-in
      </p>
    );
  }

  if (experienceStatus === ExperienceStatus.AVAILABLE) {
    return <RequestExperienceButton className="h-[26px]" variant="primary" />;
  }

  if (experienceStatus === ExperienceStatus.COMPLETED) {
    return (
      <div className="space-y-1">
        <ExperienceStatusChip
          experienceStatus={experienceStatus}
          className="mr-auto w-fit mt-0"
        />
        <RequestExperienceButton className="h-[26px] " variant="requestAgain" />
      </div>
    );
  }

  return (
    <ExperienceStatusChip
      experienceStatus={experienceStatus}
      className="mx-auto mt-2 w-full text-center"
    />
  );
};
