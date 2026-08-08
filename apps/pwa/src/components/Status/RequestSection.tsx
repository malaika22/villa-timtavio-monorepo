import { RequestCard } from './RequestCard';
import { RequestSectionProps } from './type';

export const RequestSection = ({
  visibleRequests,
  onSelect,
}: RequestSectionProps) => {
  if (visibleRequests.length === 0) {
    return (
      <p className="py-8 text-center text-[11px] text-[#9A9288]">
        No requests to show.
      </p>
    );
  }
  return (
    <div className="stagger space-y-3">
      {visibleRequests.map((request) => (
        <RequestCard key={request.id} request={request} onSelect={onSelect} />
      ))}
    </div>
  );
};
