'use client';
import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth/useAuthStore';
import { config } from '@/config';
import { decodeJwt } from '@/helpers/jwt';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, clearUser, setLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');

    if (!token) {
      setLoading(false);
      return;
    }

    const payload = decodeJwt(token);

    if (!payload) {
      sessionStorage.removeItem('access_token');
      setLoading(false);
      return;
    }

    // Check expiry
    const isExpired = payload.exp && Date.now() / 1000 > payload.exp;
    if (isExpired) {
      sessionStorage.removeItem('access_token');
      clearUser();
      router.push('/link-expired');
      return;
    }

    setUser({
      auth0Id: payload.sub,
      email: payload.email || '',
      firstName: payload.given_name || '',
      roles: payload[`${config.AUTH_NAMESPACE_URL}/roles`] || [],
      bookingId: payload[`${config.AUTH_NAMESPACE_URL}/bookingId`] || '',
      guestTier:
        payload[`${config.AUTH_NAMESPACE_URL}/guestTier`] || 'secondary',
      accessToken: token,
      tokenExpiry: payload.exp,
    });
  }, []);

  return <>{children}</>;
}
