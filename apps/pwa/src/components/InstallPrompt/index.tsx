'use client';

import { Share, SquarePlus, X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerTitle } from '@repo/ui/components/drawer';

import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { useInstallSheet } from '@/store/install/useInstallSheet';

const SHEET_COPY =
  'Opens straight to your stay — no link to find each time.';

/**
 * Adding the app to the home screen, offered twice over and never insisted on.
 *
 * A floating pill carries four words; everything else waits behind a tap. When
 * the guest dismisses it, it docks into the header rather than disappearing —
 * a nudge that destroys its own route back leaves anyone who declined with no
 * way to change their mind.
 *
 * Android gets a real one-tap install. iOS has no install API of any kind, so
 * it gets the three steps named exactly as Safari labels them — which is the
 * part a non-technical guest is actually missing.
 */
export const InstallPrompt = () => {
  const {
    eligible,
    platform,
    showPill,
    canPromptDirectly,
    showDockHint,
    dismissDockHint,
    dismissPill,
    promptInstall,
  } = useInstallPrompt();

  const { open: sheetOpen, setOpen: setSheetOpen } = useInstallSheet();

  if (!eligible) return null;

  const openSheet = async () => {
    // On Android, skip our sheet entirely when Chrome will show its own — one
    // dialog is better than a dialog about a dialog.
    if (platform === 'android' && canPromptDirectly) {
      const accepted = await promptInstall();
      if (!accepted) dismissPill();
      return;
    }
    setSheetOpen(true);
  };

  return (
    <>
      {showDockHint && (
        <>
          {/* Any tap anywhere dismisses it. Previously only the bubble itself
              did, and the full-width wrapper sat above the header swallowing
              every tap in that band — so the bell and phone were unreachable
              until the hint was cleared. */}
          <button
            type="button"
            aria-label="Dismiss"
            onClick={dismissDockHint}
            className="no-press fixed inset-0 z-40 cursor-default"
          />
          <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-end px-3 pt-[52px]">
            <button
              type="button"
              onClick={dismissDockHint}
              className="pointer-events-auto relative max-w-[190px] rounded-[10px] bg-[#0F1F2E] px-3 py-2 text-left text-[11px] leading-snug text-[#F1E5CE] shadow-lg"
            >
              {/* The chip is mounted first of the three, i.e. leftmost — the
                  tail was pinned to the right and pointed at the phone. */}
              <span
                className="absolute -top-1.5 left-[68px] size-3 rotate-45 bg-[#0F1F2E]"
                aria-hidden
              />
              Moved here — add it whenever you like.
            </button>
          </div>
        </>
      )}

      {showPill && !sheetOpen && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[76px] z-40 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-[#0F1F2E] py-2 pr-2 pl-3 shadow-[0_4px_16px_rgba(0,0,0,0.28)]">
            <button
              type="button"
              onClick={openSheet}
              className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#F1E5CE]"
            >
              <SquarePlus className="size-3.5 text-[#DCC391]" aria-hidden />
              Add to home screen
            </button>
            <button
              type="button"
              onClick={dismissPill}
              aria-label="Dismiss"
              className="flex size-[18px] items-center justify-center rounded-full bg-white/15 text-[#CFC3AE]"
            >
              <X className="size-2.5" aria-hidden />
            </button>
          </div>
        </div>
      )}

      <Drawer open={sheetOpen} onOpenChange={setSheetOpen}>
        <DrawerContent className="bg-white pb-6">
          <DrawerTitle className="sr-only">Add to home screen</DrawerTitle>
          <div className="px-4 pt-1" data-vaul-no-drag>
            <div className="flex items-center gap-2.5">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-[#0F1F2E]"
                aria-hidden
              >
                {/* The icon the guest is about to put on their home screen —
                    so it should be the one they'll actually see there. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logo-white.png"
                  alt=""
                  className="h-4 w-auto max-w-[26px] object-contain"
                />
              </span>
              <span>
                <span className="block font-cormorant text-[16px] text-[#2B2824]">
                  Add to home screen
                </span>
                <span className="block text-[11px] leading-snug text-[#797168]">
                  {SHEET_COPY}
                </span>
              </span>
            </div>

            {platform === 'android' && canPromptDirectly ? (
              <button
                type="button"
                onClick={async () => {
                  await promptInstall();
                  setSheetOpen(false);
                }}
                className="mt-3.5 w-full rounded-[8px] bg-[#0F1F2E] py-3 text-[10.5px] font-semibold tracking-[0.09em] uppercase text-[#F2E7D2]"
              >
                Add Villa TimTavio
              </button>
            ) : (
              <ol className="mt-3.5 flex flex-col gap-2">
                <Step n={1}>
                  Tap{' '}
                  <Share
                    className="inline size-3.5 -translate-y-px text-[#8A6D3B]"
                    aria-hidden
                  />{' '}
                  Share in the browser bar
                </Step>
                <Step n={2}>
                  Choose <b className="font-semibold">Add to Home Screen</b>
                </Step>
                <Step n={3}>
                  Tap <b className="font-semibold">Add</b>, top right
                </Step>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="mt-3 w-full rounded-[8px] border border-[#E3E0DA] py-2.5 text-[10.5px] font-semibold tracking-[0.09em] uppercase text-[#797168]"
            >
              Close
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <li className="flex items-center gap-2 text-[11.5px] text-[#2B2824]">
    <span
      className="flex size-[17px] shrink-0 items-center justify-center rounded-full bg-[#B08D57] text-[9px] font-bold text-white"
      aria-hidden
    >
      {n}
    </span>
    <span>{children}</span>
  </li>
);

/** The docked entry point. Lives in the header, never nags, never leaves. */
export const InstallHeaderChip = () => {
  const { eligible } = useInstallPrompt();
  const setOpen = useInstallSheet((s) => s.setOpen);
  if (!eligible) return null;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Add to home screen"
      className="flex size-[28px] items-center justify-center rounded-full border border-[#B08D57]/50 bg-[#FBF3DF]"
    >
      <SquarePlus className="size-[10px] text-[#8A6D3B]" aria-hidden />
    </button>
  );
};
