/**
 * CareVision — Zustand Auth Store
 * Phase 5 of UX improvements per carevision-ux-improvements.md
 *
 * WHY IndexedDB (Dexie): localStorage is synchronous and susceptible to XSS
 * token theft. IndexedDB is async, isolated per origin, and survives
 * service worker cache clears. Tokens are NEVER written to localStorage.
 *
 * WHY Zustand persist for user profile: The user object (name, role) can
 * safely live in localStorage — it contains no secrets and avoids a
 * flash of unauthenticated UI on page refresh.
 *
 * Token flow:
 *   login()        → POST /api/auth/token → store tokens in IndexedDB
 *   checkAuth()    → load from IndexedDB  → validate via GET /api/auth/me
 *   refreshToken() → POST /api/auth/refresh → update access token in IndexedDB
 *   logout()       → POST /api/auth/logout → clear IndexedDB + Zustand state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Dexie, { type Table } from 'dexie';
import { getAuthToken } from '@/api/endpoints';

// ─── IndexedDB schema ─────────────────────────────────────────────────────────

interface TokenRecord {
  key: string;   // 'access_token' | 'refresh_token'
  value: string;
}

class AuthDB extends Dexie {
  tokens!: Table<TokenRecord, string>;

  constructor() {
    super('CareVisionAuth');
    this.version(1).stores({
      tokens: 'key',
    });
  }
}

// Module-level singleton — one DB connection for the lifetime of the app
const authDB = new AuthDB();

// ─── Public helpers for the API client ────────────────────────────────────────

/** Read the stored access token without going through React state. */
export async function getStoredAccessToken(): Promise<string | null> {
  const record = await authDB.tokens.get('access_token');
  return record?.value ?? null;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'chw' | 'supervisor' | 'admin';
  facilityId?: string;
  isActive: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthChecking: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isAuthChecking: true,

      /**
       * Authenticate with email + password.
       * On success: stores tokens in IndexedDB, user in Zustand + localStorage.
       */
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          // OAuth2PasswordRequestForm expects application/x-www-form-urlencoded
          const response = await fetch('/api/auth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ username: email, password }),
          });

          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err?.detail ?? 'Login failed');
          }

          const data = await response.json();

          // Tokens → IndexedDB only (never localStorage)
          await authDB.tokens.put({ key: 'access_token',  value: data.access_token });
          await authDB.tokens.put({ key: 'refresh_token', value: data.refresh_token });

          const user: AuthUser = {
            id: data.user.id,
            email: data.user.email,
            fullName: data.user.full_name,
            role: data.user.role,
            facilityId: data.user.facility_id ?? undefined,
            isActive: data.user.is_active,
          };

          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      /**
       * Invalidate session server-side, then clear all local state.
       */
      logout: async () => {
        // Fire and forget — if offline, tokens will be unusable after expiry anyway
        const token = await getStoredAccessToken();
        if (token) {
          fetch('/api/auth/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => void 0);
        }

        await authDB.tokens.clear();
        set({ user: null, isAuthenticated: false });
      },

      /**
       * Exchange the stored refresh token for a new access token.
       * Called proactively before expiry by the API client interceptor.
       */
      refreshAccessToken: async () => {
        const record = await authDB.tokens.get('refresh_token');
        if (!record) {
          await get().logout();
          return;
        }

        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: record.value }),
          });

          if (!response.ok) throw new Error('Refresh failed');

          const data = await response.json();
          await authDB.tokens.put({ key: 'access_token', value: data.access_token });
        } catch {
          // Refresh token invalid or expired — force re-login
          await get().logout();
        }
      },

      /**
       * On app mount: check IndexedDB for tokens, validate with /api/auth/me.
       * Handles the offline case gracefully (uses cached user profile).
       */
      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const stored = await authDB.tokens.get('access_token');
          if (!stored) {
            set({ isLoading: false, isAuthChecking: false });
            return;
          }

          const response = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${stored.value}` },
          });

          if (response.ok) {
            const data = await response.json();
            const user: AuthUser = {
              id: data.id,
              email: data.email,
              fullName: data.full_name,
              role: data.role,
              facilityId: data.facility_id ?? undefined,
              isActive: data.is_active,
            };
            set({ user, isAuthenticated: true, isAuthChecking: false });
          } else if (response.status === 401) {
            // Try to refresh before giving up
            await get().refreshAccessToken();
          }
          // Other errors (503 offline etc.) — keep cached user in Zustand
        } finally {
          set({ isLoading: false, isAuthChecking: false });
        }
      },
    }),
    {
      name: 'carevision-auth',
      storage: createJSONStorage(() => localStorage),
      // WHY partial persist: Only user profile (no secrets) goes to localStorage.
      // Tokens live exclusively in IndexedDB via the async helpers above.
      partialize: (state) => ({ user: state.user }),
    }
  )
);
