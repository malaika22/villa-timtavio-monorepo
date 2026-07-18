'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';
import { Header } from './Header';
import { PushRegistrar } from './PushRegistrar';

// Pre-auth / error routes render bare — no header, bottom nav, or push
// registration, so PWA feature entry points aren't shown to an unauthenticated
// or errored visitor (e.g. the magic-link callback and link-expired screens).
const BARE_ROUTES = ['/auth', '/link-expired'];

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isBare = BARE_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );

  if (isBare) {
    return <div>{children}</div>;
  }

  return (
    <div>
      <PushRegistrar />
      <Header />
      {children}
      <Footer />
    </div>
  );
};
