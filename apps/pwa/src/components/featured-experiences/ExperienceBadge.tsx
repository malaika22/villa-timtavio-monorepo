export const ExperienceBadge = ({
  experienceName,
}: {
  experienceName: string;
}) => {
  return (
    <div className="rounded-full bg-[#3D3834]/78 px-2.5 py-1 ring-1 ring-white/12 uppercase text-[6px] text-[#FFFFFFB2] tracking-[0.84px] border border-[#FFFFFF33] py-1  min-w-[53px] px-[7.5px]">
      {experienceName}
    </div>
  );
};
