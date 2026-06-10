import { create } from 'zustand';
import { AuthState } from './types';
import { GuestTierEnum } from '@/types/guest';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isPrimary: false,
  isSecondary: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
      isPrimary: user.guestTier === GuestTierEnum.primary,
      isSecondary: user.guestTier === GuestTierEnum.secondary,
    }),

  clearUser: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isPrimary: false,
      isSecondary: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),
}));
