'use client';

import { useEffect, useState } from 'react';

/** Chrome's install event. Not in lib.dom — Safari has no equivalent at all. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISSED_AT = 'vt-install-dismissed-at';
const DISMISS_COUNT = 'vt-install-dismiss-count';
const DOCK_SEEN = 'vt-install-dock-seen';

/** A dismissal is a "not now", not a "never" — but it has to mean weeks. */
const QUIET_DAYS = 14;
/** Ask twice at most. After that the header chip is the only offer. */
const MAX_ASKS = 2;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode — the nudge simply reappears next visit */
  }
}

export type InstallPlatform = 'android' | 'ios' | 'other';

/**
 * Whether, and how, to offer adding the app to the home screen.
 *
 * Three things decide it. Whether the app is already installed — a standalone
 * display mode means there is nothing to offer. Whether this is a phone at all.
 * And whether the guest has already said no, recently or twice.
 *
 * The pill and the header chip are deliberately different offers: the pill can
 * be declined and goes quiet, the chip never nags and never leaves, so a guest
 * who dismisses still has a way back.
 */
export function useInstallPrompt() {
  const [platform, setPlatform] = useState<InstallPlatform>('other');
  const [installed, setInstalled] = useState(true);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [pillDismissed, setPillDismissed] = useState(true);
  const [showDockHint, setShowDockHint] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS predates the display-mode media query for home-screen apps.
      (window.navigator as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    if (standalone) return;

    const ua = window.navigator.userAgent;
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      // iPadOS reports as a Mac; the touch points give it away.
      (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    setPlatform(isIOS ? 'ios' : isAndroid ? 'android' : 'other');

    const asks = Number(read(DISMISS_COUNT) ?? 0);
    const last = Number(read(DISMISSED_AT) ?? 0);
    const quietUntil = last + QUIET_DAYS * 24 * 60 * 60 * 1000;
    setPillDismissed(asks >= MAX_ASKS || Date.now() < quietUntil);

    const onBeforeInstall = (e: Event) => {
      // Keep the event so our own button can fire it later; Chrome only allows
      // that from inside a user gesture, so its own banner is suppressed.
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismissPill = () => {
    const asks = Number(read(DISMISS_COUNT) ?? 0) + 1;
    write(DISMISS_COUNT, String(asks));
    write(DISMISSED_AT, String(Date.now()));
    setPillDismissed(true);
    // Say where it went, once. A guest who has already been told doesn't need
    // telling again, and repeating it would read as re-asking.
    if (!read(DOCK_SEEN)) {
      write(DOCK_SEEN, '1');
      setShowDockHint(true);
    }
  };

  /** Fires Chrome's own install dialog. Returns false when there isn't one. */
  const promptInstall = async (): Promise<boolean> => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome === 'accepted';
  };

  const eligible = !installed && (platform === 'ios' || platform === 'android');

  return {
    /** Anything at all to offer — gates the header chip too. */
    eligible,
    platform,
    /** The floating pill: eligible, and not recently or repeatedly declined. */
    showPill: eligible && !pillDismissed,
    /** True once Chrome has offered — otherwise we show instructions instead. */
    canPromptDirectly: !!deferred,
    showDockHint,
    dismissDockHint: () => setShowDockHint(false),
    dismissPill,
    promptInstall,
  };
}
