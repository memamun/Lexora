import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '@/lib/AuthContext';

// Mock the external dependencies
vi.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet">Mocked Outlet</div>
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('@/components/UserNotRegisteredError', () => ({
  default: () => <div data-testid="user-not-registered">User Not Registered Error</div>
}));

vi.mock('@/components/ui/LexoraLogo', () => ({
  default: () => <div data-testid="lexora-logo">Lexora Logo</div>
}));

describe('ProtectedRoute', () => {
  const mockUnauthenticatedElement = <div data-testid="unauthenticated">Unauthenticated</div>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders default fallback when isLoadingAuth is true', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoadingAuth: true,
      authChecked: false,
      authError: null
    });

    render(<ProtectedRoute unauthenticatedElement={mockUnauthenticatedElement} />);

    expect(screen.getByText('Verifying session...')).toBeInTheDocument();
    expect(screen.getByTestId('lexora-logo')).toBeInTheDocument();
  });

  it('renders custom fallback when provided and auth is loading', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoadingAuth: true,
      authChecked: false,
      authError: null
    });

    const CustomFallback = <div data-testid="custom-fallback">Custom Fallback</div>;

    render(
      <ProtectedRoute
        fallback={CustomFallback}
        unauthenticatedElement={mockUnauthenticatedElement}
      />
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });

  it('renders default fallback when authChecked is false', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoadingAuth: false,
      authChecked: false,
      authError: null
    });

    render(<ProtectedRoute unauthenticatedElement={mockUnauthenticatedElement} />);

    expect(screen.getByText('Verifying session...')).toBeInTheDocument();
  });

  it('renders UserNotRegisteredError when authError type is user_not_registered', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoadingAuth: false,
      authChecked: true,
      authError: { type: 'user_not_registered' }
    });

    render(<ProtectedRoute unauthenticatedElement={mockUnauthenticatedElement} />);

    expect(screen.getByTestId('user-not-registered')).toBeInTheDocument();
  });

  it('renders unauthenticatedElement when authError is present but not user_not_registered', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoadingAuth: false,
      authChecked: true,
      authError: { type: 'some_other_error' }
    });

    render(<ProtectedRoute unauthenticatedElement={mockUnauthenticatedElement} />);

    expect(screen.getByTestId('unauthenticated')).toBeInTheDocument();
  });

  it('renders unauthenticatedElement when not authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoadingAuth: false,
      authChecked: true,
      authError: null
    });

    render(<ProtectedRoute unauthenticatedElement={mockUnauthenticatedElement} />);

    expect(screen.getByTestId('unauthenticated')).toBeInTheDocument();
  });

  it('renders Outlet when authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoadingAuth: false,
      authChecked: true,
      authError: null
    });

    render(<ProtectedRoute unauthenticatedElement={mockUnauthenticatedElement} />);

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });
});
