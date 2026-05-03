export const HeroCard = () => {
  return (
    <div className="bg-[#0F1F2E] rounded-[10px] ">
      <div className="h-[90px] bg-[linear-gradient(160deg,_#1A3040_0%,_#0F1F2E_100%)] relative rounded-t-[10px]">
        <div className="flex items-center justify-between bg-[#ffffff14] text-[#ffffff80] rounded-[3px] px-[6px] py-[2px] text-[7px] tracking-[0.12em] absolute top-2 left-2">
          Villa TimTavio · Estate
        </div>
        <div className="italic bottom-[8px] absolute right-[10px] text-white font-cormorant text-[20px] tracking-[0.2em]">
          Villa TimTavio
        </div>
      </div>
      <div className="flex items-center px-[14px] py-[12px] justify-between">
        {/* CHECK IN */}
        <div className="space-y-2">
          <div className="text-[#FFFFFF40] text-[8px] tracking-[3.08px]">
            CHECK-IN
          </div>
          <div className="text-[#FFFFFFA6]  text-[12px]">Mar 20</div>
        </div>
        <div className="w-[1px] bg-[#FFFFFF14] self-stretch" />
        {/* CHECK OUT */}
        <div className="space-y-2">
          <div className="text-[#FFFFFF40] text-[8px] tracking-[3.08px]">
            CHECK-OUT
          </div>
          <div className="text-[#FFFFFFA6]  text-[12px]">Mar 24</div>
        </div>
        <div className="w-[1px] bg-[#FFFFFF14] self-stretch" />
        {/* NIGHTS */}
        <div className="space-y-2">
          <div className="text-[#FFFFFF40] text-[8px] tracking-[3.08px]">
            NIGHTS
          </div>
          <div className="text-[#FFFFFFA6]  text-[12px]">4</div>
        </div>
        <div className="w-[1px] bg-[#FFFFFF14] self-stretch" />
        {/* NIGHTS */}
        <div className="space-y-2">
          <div className="text-[#FFFFFF40] text-[8px] tracking-[3.08px]">
            GUESTS
          </div>
          <div className="text-[#FFFFFFA6]  text-[12px]">2</div>
        </div>
      </div>
    </div>
  );
};
