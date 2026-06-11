'use client';

import { useEffect } from 'react';

export function TokenInitializer() {
  useEffect(() => {
    fetch('/api/auth/token')
      .then((r) => {
        if (!r.ok) return null;
        return r.json() as Promise<{ accessToken?: string }>;
      })
      .then((data) => {
        if (data?.accessToken) {
          localStorage.setItem('access_token', data.accessToken);
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
