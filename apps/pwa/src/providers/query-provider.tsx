'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';
import { useOfflineRequestSync } from '@/hooks/useOfflineRequestSync';

// Lives inside the provider so it can use the query client. Drains any
// experience requests queued while offline once connectivity returns.
function OfflineRequestSync() {
  useOfflineRequestSync();
  return null;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (failureCount, error: any) => {
              if (error?.status === 401) return false;
              return failureCount < 2;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <OfflineRequestSync />
      {children}
    </QueryClientProvider>
  );
}
