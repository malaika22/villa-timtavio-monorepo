const CHECKOUT_HEADER_MOCK = {
  guestName: 'Sarah',
  villa: 'Azul',
  stay: 'Mar 20–24',
  nights: 4,
};

export const CheckoutHeader = () => {
  const { guestName, villa, stay, nights } = CHECKOUT_HEADER_MOCK;

  return (
    <div className="flex flex-col items-center bg-[#0F0E0C] px-6 pt-10 pb-8 gap-5">
      {/* Ornamental vertical line */}
      <div className="w-px h-12 bg-gradient-to-b from-transparent via-[#4A4840] to-transparent" />

      {/* Brand label */}
      <p className="text-[9px] font-medium uppercase tracking-[3px] text-[#5C5A54]">
        Casa Timtavio
      </p>

      {/* Heading */}
      <div className="text-center -mt-1">
        <h1 className="font-cormorant text-[44px] font-light italic leading-[1.15] text-[#F0EDE6]">
          Thank you,
        </h1>
        <h1 className="font-cormorant text-[44px] font-light italic leading-[1.15] text-[#F0EDE6]">
          {guestName}.
        </h1>
      </div>

      {/* Subtext */}
      <p className="text-[14px] font-light leading-relaxed text-[#6B6860] text-center">
        Your stay at Villa {villa} has concluded.
      </p>

      {/* Status badge */}
      <p className="text-[9px] font-semibold uppercase tracking-[3.5px] text-[#5C5A54]">
        Checked Out
      </p>

      {/* Stats card */}
      <div className="w-full mt-2 rounded-[14px] bg-[#1A1916] border border-[#2C2B27] flex divide-x divide-[#2C2B27]">
        <StatCell label="Villa" value={villa} />
        <StatCell label="Stay" value={stay} />
        <StatCell label="Nights" value={String(nights)} />
      </div>
    </div>
  );
};

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-5 gap-1.5 min-w-0">
      <span className="text-[8px] font-semibold uppercase tracking-[2px] text-[#5C5A54]">
        {label}
      </span>
      <span className="text-[16px] font-light text-[#D9D5CE] truncate">
        {value}
      </span>
    </div>
  );
}
