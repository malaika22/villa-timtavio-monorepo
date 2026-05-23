export const RequestProgressBar = ({
  progressPercent,
  progressLabel,
}: {
  progressPercent?: number;
  progressLabel?: string;
}) => {
  if (!progressPercent) return null;
  return (
    <div className="mt-3 space-y-1.5">
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-[#EBE7E0]">
        <div
          className="h-full rounded-full bg-[#7B5EA7] transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {progressLabel && (
        <p className="text-[8px] font-medium uppercase tracking-[1.2px] text-[#9A9288]">
          {progressLabel}
        </p>
      )}
    </div>
  );
};
