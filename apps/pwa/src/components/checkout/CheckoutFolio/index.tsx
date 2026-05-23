const CHECKOUT_FOLIO_MOCK = {
  amount: 15822.4,
  settled: true,
  quote: '"We hope to welcome you back\nto Puerto Escondido."',
};

export const CheckoutFolio = () => {
  const { amount, settled, quote } = CHECKOUT_FOLIO_MOCK;

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);

  return (
    <div className="flex flex-col gap-5 bg-[#F5F0E8] px-5 pt-7 pb-10 flex-1">
      {/* Folio card */}
      <div className="rounded-[14px] border border-[#E3DDD4] bg-white px-5 py-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-[2px] text-[#9A9288]">
              Final Folio
            </span>
            <span className="font-cormorant text-[36px] font-medium leading-none text-[#1A1A18]">
              {formattedAmount}
            </span>
          </div>

          {settled && (
            <div className="mt-1 shrink-0 flex items-center gap-1.5 rounded-full border border-[#3A5E4847] bg-[#3A5E4818] px-3 py-1.5">
              <span className="size-[5px] rounded-full bg-[#3A5E48] shrink-0" />
              <span className="text-[9px] font-semibold uppercase tracking-[1.4px] text-[#3A5E48]">
                Settled
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CTA button */}
      <button
        type="button"
        className="w-full rounded-[12px] bg-[#1A1A18] py-4 text-[10px] font-semibold uppercase tracking-[2.5px] text-white transition-opacity hover:opacity-90 active:opacity-80"
      >
        View Receipt
      </button>

      {/* Closing quote */}
      <p className="mt-2 text-center font-cormorant text-[17px] italic leading-[1.5] text-[#9A9288] whitespace-pre-line">
        {quote}
      </p>
    </div>
  );
};
