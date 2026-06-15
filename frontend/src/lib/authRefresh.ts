import { useAuthStore } from '../store/authStore';
import { API_BASE_URL } from '../config/api';

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Perform silent refresh token rotation via HTTP POST /auth/refresh REST endpoint.
 * Ensures concurrent requests share the same refresh process to prevent replay attack triggers.
 */
export async function refreshSession(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (res.ok) {
        const data = (await res.json()) as { ok: boolean; session_id: string };
        if (data.ok) {
          const currentUser = useAuthStore.getState().user;
          if (currentUser) {
            useAuthStore.getState().setAuth(currentUser, 'logged_in');
          }
          return true;
        }
      }

      // If refresh failed, clear local auth and redirect to login page
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
      return false;
    } catch {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
