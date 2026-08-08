/**
 * What a guest sees while a tab is fetching.
 *
 * The branded black screen used to do this job, and it was the wrong job: as
 * `app/loading.tsx` it fires on *any* navigation that suspends, so tapping
 * Folio flashed "Authenticating your stay" at someone who signed in three days
 * ago. It also covers the header and footer, so the app appeared to be
 * rebuilding itself from nothing on a tab change.
 *
 * This stays inside the layout — the chrome never leaves — and says only what
 * is true: something is on its way.
 */
export const RouteLoading = () => (
  <div
    role="status"
    aria-live="polite"
    aria-busy="true"
    className="flex flex-1 flex-col"
  >
    {/* The one moving thing. A guest reads a bar as progress and a spinner as
        waiting, and these are almost always over in a few hundred ms. */}
    <div
      className="h-[2px] w-full overflow-hidden bg-[#EFEAE1]"
      aria-hidden
    >
      <span className="animate-route-progress block h-full w-2/5 rounded-full bg-[#B08D57]" />
    </div>

    <div className="flex flex-col gap-3 px-4 pt-5">
      {/* Deliberately generic. A per-tab skeleton would be better still, but a
          wrong-shaped one is worse than a neutral one — it promises a layout
          the page then contradicts. */}
      <span className="skeleton h-3 w-24 rounded-full bg-[#E8E5E0]" />
      <span className="skeleton h-[104px] w-full rounded-[14px] bg-[#E8E5E0]" />
      <span className="skeleton h-[104px] w-full rounded-[14px] bg-[#E8E5E0]" />
      <span className="skeleton h-[104px] w-full rounded-[14px] bg-[#E8E5E0]" />
    </div>

    <span className="sr-only">Loading</span>
  </div>
);
