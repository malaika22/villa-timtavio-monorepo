'use client';
import { config } from '@/config/config';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

interface DashboardUser {
  name: string;
  email: string;
  picture?: string;
  role: 'owner' | 'estate_manager';
  isOwner: boolean;
  isEM: boolean;
  roles: string[];
}

export function useDashboardAuth() {
  const { user, isLoading, error } = useUser({
    route: config.publicProfileRoute,
  });
  const router = useRouter();

  const rolesClaim = (user as Record<string, unknown> | undefined | null)?.[
    `${config.auth0.auth0Namespace}/roles`
  ];
  const roles: string[] = Array.isArray(rolesClaim)
    ? rolesClaim.filter((role): role is string => typeof role === 'string')
    : [];
  const isOwner = roles.includes('owner');
  const isEM = roles.includes('estate_manager');

  const dashboardUser: DashboardUser | null = user
    ? {
        name: user.name || '',
        email: user.email || '',
        picture: user.picture || undefined,
        role: isOwner ? 'owner' : 'estate_manager',
        isOwner,
        isEM,
        roles,
      }
    : null;

  const signOut = useCallback(() => {
    router.push('/api/auth/logout');
  }, [router]);

  return {
    user: dashboardUser,
    isLoading,
    error,
    isOwner,
    isEM,
    signOut,
  };
}
