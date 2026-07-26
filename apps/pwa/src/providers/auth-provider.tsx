'use client';
import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth/useAuthStore';
import { useBookingStore } from '@/store/useBookingStore';
import { config } from '@/config';
import { decodeJwt } from '@/helpers/jwt';
import { bookingsApi } from '@/lib/api/bookings';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, clearUser, setLoading } = useAuthStore();
  const setBooking = useBookingStore((s) => s.setBooking);
  const router = useRouter();

  useEffect(() => {
    // The /auth/callback route owns the sign-in flow (OTP exchange → fresh
    // session). Don't bootstrap from a possibly-stale localStorage token here,
    // or we race the callback and flash "/link-expired" (from an old, expired
    // token) before the new session lands. Let the callback finish.
    if (window.location.pathname.startsWith('/auth/callback')) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('access_token');

    if (!token) {
      setLoading(false);
      return;
    }

    const payload = decodeJwt(token);

    if (!payload) {
      localStorage.removeItem('access_token');
      setLoading(false);
      return;
    }

    // Check expiry
    const isExpired = payload.exp && Date.now() / 1000 > payload.exp;
    if (isExpired) {
      localStorage.removeItem('access_token');
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

    // Prefetch current booking into Zustand store (non-blocking)
    bookingsApi
      .getCurrent()
      .then(setBooking)
      .catch((error) => {
        console.error('Failed to fetch current booking:', error);
      });
  }, []);

  return <>{children}</>;
}
