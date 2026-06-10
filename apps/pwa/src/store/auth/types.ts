import { AuthUser } from '@/types/auth';

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPrimary: boolean;
  isSecondary: boolean;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
  setLoading: (v: boolean) => void;
}
