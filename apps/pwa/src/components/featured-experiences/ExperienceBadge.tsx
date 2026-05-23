export const ExperienceBadge = ({
  experienceName,
}: {
  experienceName: string;
}) => {
  return (
    <div className="rounded-full bg-[#0C0806BF] px-2.5 py-1 ring-1 ring-white/12 uppercase text-[6px] text-[#FFFFFFB2] tracking-[0.84px] border border-[#FFFFFF33] py-1  min-w-[53px] px-[7.5px] text-center">
      {experienceName}
    </div>
  );
};
