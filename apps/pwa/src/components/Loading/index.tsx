export const Loading = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[100] flex h-screen min-h-[100dvh] flex-col items-center justify-center gap-8 bg-black px-6"
    >
      <div className="h-11 w-px origin-center bg-[#ffffff4a]" aria-hidden />

      <div className="space-y-4 text-center">
        <p className="text-[10px] tracking-[0.28em] text-[#FFFFFF40]">
          VILLA TIMTAVIO
        </p>
        <h1 className="font-cormorant text-[34px] leading-[1.05] font-normal italic text-[#FFFFFFE0] motion-reduce:animate-none motion-reduce:opacity-100 animate-[loading-headline_3.5s_ease-in-out_infinite]">
          A Protected Sanctuary
        </h1>
      </div>

      <div className="h-11 w-px origin-center bg-[#ffffff4a]" aria-hidden />

      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center gap-2" aria-hidden>
          <span className="size-1.5 rounded-full bg-[#5C3530] motion-reduce:animate-none motion-reduce:opacity-80 animate-[loading-dot_1.2s_ease-in-out_infinite]" />
          <span className="size-1.5 rounded-full bg-[#5C3530] motion-reduce:animate-none motion-reduce:opacity-80 animate-[loading-dot_1.2s_ease-in-out_infinite] [animation-delay:0.2s]" />
          <span className="size-1.5 rounded-full bg-[#5C3530] motion-reduce:animate-none motion-reduce:opacity-80 animate-[loading-dot_1.2s_ease-in-out_infinite] [animation-delay:0.4s]" />
        </div>

        <div className="h-px w-36 overflow-hidden rounded-full bg-[#FFFFFF14]">
          <div
            className="h-full w-2/5 rounded-full bg-gradient-to-r from-transparent via-timtavio-background to-transparent motion-reduce:animate-none motion-reduce:translate-x-1/2 motion-reduce:opacity-70 animate-[loading-scan_1.8s_ease-in-out_infinite]"
            aria-hidden
          />
        </div>

        <p className="text-center text-[10px] tracking-[3.08px] text-[#9a9898e0] mt-4">
          AUTHENTICATING YOUR STAY
        </p>
      </div>

      <span className="sr-only">Loading</span>
    </div>
  );
};
