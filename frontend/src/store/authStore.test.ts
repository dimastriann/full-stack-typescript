import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from './authStore';
import type { UserType } from '../types/Users';

const user = {
  id: 1,
  email: 'user@example.com',
  name: 'User',
} as unknown as UserType;

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    useAuthStore.setState({ session: '', user: null, loading: false });
  });

  it('stores the authenticated user and session marker', () => {
    useAuthStore.getState().setAuth(user, 'logged_in');

    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().session).toBe('logged_in');
    expect(useAuthStore.getState().loading).toBe(false);
    expect(JSON.parse(sessionStorage.getItem('user') ?? 'null')).toEqual(user);
  });

  it('clears the session, cached user, and last workspace on logout', () => {
    sessionStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('lastWorkspaceId', '5');
    useAuthStore.setState({ session: 'logged_in', user });

    useAuthStore.getState().clearAuth();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().session).toBe('');
    expect(useAuthStore.getState().loading).toBe(false);
    expect(sessionStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('lastWorkspaceId')).toBeNull();
  });

  it('updates the loading flag without touching credentials', () => {
    useAuthStore.getState().setLoading(true);

    expect(useAuthStore.getState().loading).toBe(true);
    expect(useAuthStore.getState().session).toBe('');
  });

  it('hydrates the initial state from session storage', async () => {
    sessionStorage.setItem('user', JSON.stringify(user));
    vi.resetModules();

    const { useAuthStore: freshStore } = await import('./authStore');

    expect(freshStore.getState().user).toEqual(user);
    expect(freshStore.getState().session).toBe('logged_in');
    expect(freshStore.getState().loading).toBe(false);
  });

  it('starts logged out when session storage is empty', async () => {
    vi.resetModules();

    const { useAuthStore: freshStore } = await import('./authStore');

    expect(freshStore.getState().user).toBeNull();
    expect(freshStore.getState().session).toBe('');
    expect(freshStore.getState().loading).toBe(true);
  });
});
