import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '../store/authStore';

function renderWithRoute(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>private dashboard</div>} />
        </Route>
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({ session: '', user: null, loading: false });
  });

  it('renders the protected content for an authenticated session', () => {
    useAuthStore.setState({ session: 'logged_in' });

    renderWithRoute();

    expect(screen.getByText('private dashboard')).toBeInTheDocument();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated visitors to the login page', () => {
    renderWithRoute();

    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('private dashboard')).not.toBeInTheDocument();
  });
});
