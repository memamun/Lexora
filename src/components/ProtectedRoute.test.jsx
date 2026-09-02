import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '@/lib/AuthContext';

vi.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet" />
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('@/components/UserNotRegisteredError', () => ({
  default: () => <div data-testid="user-not-registered-error" />
}));

vi.mock('@/components/ui/LexoraLogo', () => ({
  default: () => <div data-testid="lexora-logo" />
}));

describe('ProtectedRoute', () => {
  const UnauthElement = <div data-testid="unauthenticated-element" />;
  const CustomFallback = <div data-testid="custom-fallback" />;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders default fallback when isLoadingAuth is true', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoadingAuth: true,
      authChecked: false,
      authError: null,
    });
    render(<ProtectedRoute unauthenticatedElement={UnauthElement} />);
    expect(screen.getByTestId('lexora-logo')).toBeInTheDocument();
    expect(screen.getByText(/Verifying session.../i)).toBeInTheDocument();
  });

  it('renders custom fallback when isLoadingAuth is true and fallback is provided', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoadingAuth: true,
      authChecked: false,
      authError: null,
    });
    render(<ProtectedRoute fallback={CustomFallback} unauthenticatedElement={UnauthElement} />);
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });

  it('renders fallback when authChecked is false', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoadingAuth: false,
      authChecked: false,
      authError: null,
    });
    render(<ProtectedRoute unauthenticatedElement={UnauthElement} />);
    expect(screen.getByTestId('lexora-logo')).toBeInTheDocument();
  });

  it('renders UserNotRegisteredError when authError type is user_not_registered', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoadingAuth: false,
      authChecked: true,
      authError: { type: 'user_not_registered' },
    });
    render(<ProtectedRoute unauthenticatedElement={UnauthElement} />);
    expect(screen.getByTestId('user-not-registered-error')).toBeInTheDocument();
  });

  it('renders unauthenticatedElement when authError is of another type', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoadingAuth: false,
      authChecked: true,
      authError: { type: 'other_error' },
    });
    render(<ProtectedRoute unauthenticatedElement={UnauthElement} />);
    expect(screen.getByTestId('unauthenticated-element')).toBeInTheDocument();
  });

  it('renders unauthenticatedElement when isAuthenticated is false', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoadingAuth: false,
      authChecked: true,
      authError: null,
    });
    render(<ProtectedRoute unauthenticatedElement={UnauthElement} />);
    expect(screen.getByTestId('unauthenticated-element')).toBeInTheDocument();
  });

  it('renders Outlet when isAuthenticated is true', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoadingAuth: false,
      authChecked: true,
      authError: null,
    });
    render(<ProtectedRoute unauthenticatedElement={UnauthElement} />);
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });
});
