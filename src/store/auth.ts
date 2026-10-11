import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Fixed demo credentials + OTP. These are intentionally public: the sign-in
// screen prints them on screen so the portal can be practiced/automated.
export const TEST_CREDENTIALS = {
  username: 'analyst',
  password: 'acmedesk123',
} as const;

export const TEST_OTP = '123456';

export function checkCredentials(username: string, password: string): boolean {
  return username.trim() === TEST_CREDENTIALS.username && password === TEST_CREDENTIALS.password;
}

export function checkOtp(code: string): boolean {
  return code.trim() === TEST_OTP;
}

export interface AuthUser {
  username: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  signIn: (username: string) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      signIn: (username) => set({ user: { username }, isAuthenticated: true }),
      signOut: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'acmedesk-auth' },
  ),
);

export function initialsOf(name: string): string {
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
