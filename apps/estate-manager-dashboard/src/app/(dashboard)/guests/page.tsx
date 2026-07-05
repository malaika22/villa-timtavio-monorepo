import { Suspense } from 'react';

import { GuestsPage } from '@/components/manager/pages/guests/GuestsPage';

// GuestsPage reads useSearchParams(), which requires a Suspense boundary so the
// static shell can render while the client resolves the query string.
export default function Page() {
  return (
    <Suspense>
      <GuestsPage />
    </Suspense>
  );
}
