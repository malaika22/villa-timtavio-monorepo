import { useAuthStore } from '@/store/auth/useAuthStore';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useAuth() {
  const {
    user,
    isLoading,
    isAuthenticated,
    isPrimary,
    isSecondary,
    clearUser,
  } = useAuthStore();
  const router = useRouter();

  const signOut = useCallback(async () => {
    const res = await fetch('/api/auth/signout', { method: 'POST' });
    const { logoutUrl } = await res.json();

    localStorage.removeItem('access_token');
    document.cookie = 'auth_session=; Max-Age=0; path=/';
    clearUser();

    // Redirect to Auth0 logout
    router.push(logoutUrl);
  }, [clearUser]);

  return {
    user,
    isLoading,
    isAuthenticated,
    isPrimary,
    isSecondary,
    signOut,
    bookingId: user?.bookingId || null,
    accessToken: user?.accessToken || null,
    email: user?.email || null,
    firstName: user?.firstName || null,
  };
}
