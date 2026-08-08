'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';
import { Header } from './Header';
import { PushRegistrar } from './PushRegistrar';
import { InstallPrompt } from '@/components/InstallPrompt';
import { Loading } from '@/components/Loading';
import { useAuth } from '@/hooks/useAuth';

// Pre-auth / error routes render bare — no header, bottom nav, or push
// registration, so PWA feature entry points aren't shown to an unauthenticated
// or errored visitor (e.g. the magic-link callback and link-expired screens).
const BARE_ROUTES = ['/auth', '/link-expired', '/welcome'];

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { isLoading: authLoading } = useAuth();
  const isBare = BARE_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );

  if (isBare) {
    return <div>{children}</div>;
  }

  // The branded screen, restored to the one moment it describes. It was
  // wired to `app/loading.tsx`, which fires on any navigation that suspends —
  // so a guest signed in for three days got "Authenticating your stay" for
  // tapping Folio. Here it runs once, while the token is being read, and
  // route changes get the quiet loader instead.
  if (authLoading) {
    return <Loading />;
  }

  return (
    // Fill the viewport and let the content area grow, so the footer nav stays
    // pinned at the bottom even when a page has little/no content.
    <div className="flex min-h-[100dvh] flex-col">
      <PushRegistrar />
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      {/* Fixed chrome, so it never depends on the guest scrolling. Bare routes
          return above — nothing is offered before a session exists. */}
      <InstallPrompt />
      <Footer />
    </div>
  );
};
