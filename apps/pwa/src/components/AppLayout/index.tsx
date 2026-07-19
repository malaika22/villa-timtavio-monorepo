'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';
import { Header } from './Header';
import { PushRegistrar } from './PushRegistrar';

// Pre-auth / error routes render bare — no header, bottom nav, or push
// registration, so PWA feature entry points aren't shown to an unauthenticated
// or errored visitor (e.g. the magic-link callback and link-expired screens).
const BARE_ROUTES = ['/auth', '/link-expired', '/welcome'];

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isBare = BARE_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );

  if (isBare) {
    return <div>{children}</div>;
  }

  return (
    // Fill the viewport and let the content area grow, so the footer nav stays
    // pinned at the bottom even when a page has little/no content.
    <div className="flex min-h-[100dvh] flex-col">
      <PushRegistrar />
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  );
};
