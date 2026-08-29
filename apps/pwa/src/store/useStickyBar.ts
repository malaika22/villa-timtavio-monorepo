import { create } from 'zustand';

/**
 * How much of the bottom of the screen a page has claimed for its own actions.
 *
 * The install pill floats at a fixed offset above the tab bar, which is
 * exactly where the manifest puts its action bar — and the pill sits at z-40
 * against the bar's z-20, so on a first visit "Add guest" was painted over by
 * a nudge the guest had never had the chance to dismiss. A passive suggestion
 * must not cover a page's primary action, so the pill steps up by however much
 * the page is using.
 *
 * Measured rather than assumed: the bar carries one button or three depending
 * on what is left to do.
 */
type StickyBarState = {
  height: number;
  setHeight: (height: number) => void;
};

export const useStickyBar = create<StickyBarState>((set) => ({
  height: 0,
  setHeight: (height) => set({ height }),
}));
