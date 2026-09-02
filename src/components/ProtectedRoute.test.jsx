import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '@/lib/AuthContext';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="mock-outlet">Outlet Content</div>,
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/components/UserNotRegisteredError', () => ({
  default: () => <div data-testid="mock-user-not-registered-error">User Not Registered Error</div>,
}));

vi.mock('@/components/ui/LexoraLogo', () => ({
  default: () => <div data-testid="mock-lexora-logo">Lexora Logo</div>,
}));

describe('ProtectedRoute', () => {
  const UnauthenticatedElement = <div data-testid="mock-unauthenticated">Unauthenticated Element</div>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders fallback when auth is loading', () => {
    useAuth.mockReturnValue({
      isLoadingAuth: true,
      authChecked: false,
      isAuthenticated: false,
      authError: null,
    });

    render(<ProtectedRoute unauthenticatedElement={UnauthenticatedElement} />);

    expect(screen.getByTestId('mock-lexora-logo')).toBeInTheDocument();
    expect(screen.getByText(/verifying session/i)).toBeInTheDocument();
  });

  it('renders fallback when auth is not checked', () => {
    useAuth.mockReturnValue({
      isLoadingAuth: false,
      authChecked: false,
      isAuthenticated: false,
      authError: null,
    });

    render(<ProtectedRoute unauthenticatedElement={UnauthenticatedElement} />);

    expect(screen.getByTestId('mock-lexora-logo')).toBeInTheDocument();
    expect(screen.getByText(/verifying session/i)).toBeInTheDocument();
  });

  it('renders custom fallback when provided and auth is loading', () => {
    useAuth.mockReturnValue({
      isLoadingAuth: true,
      authChecked: false,
      isAuthenticated: false,
      authError: null,
    });

    render(<ProtectedRoute fallback={<div data-testid="custom-fallback">Custom Fallback</div>} unauthenticatedElement={UnauthenticatedElement} />);

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });

  it('renders UserNotRegisteredError when authError type is user_not_registered', () => {
    useAuth.mockReturnValue({
      isLoadingAuth: false,
      authChecked: true,
      isAuthenticated: false,
      authError: { type: 'user_not_registered' },
    });

    render(<ProtectedRoute unauthenticatedElement={UnauthenticatedElement} />);

    expect(screen.getByTestId('mock-user-not-registered-error')).toBeInTheDocument();
  });

  it('renders unauthenticatedElement when authError is of other type', () => {
    useAuth.mockReturnValue({
      isLoadingAuth: false,
      authChecked: true,
      isAuthenticated: false,
      authError: { type: 'some_other_error' },
    });

    render(<ProtectedRoute unauthenticatedElement={UnauthenticatedElement} />);

    expect(screen.getByTestId('mock-unauthenticated')).toBeInTheDocument();
  });

  it('renders unauthenticatedElement when not authenticated', () => {
    useAuth.mockReturnValue({
      isLoadingAuth: false,
      authChecked: true,
      isAuthenticated: false,
      authError: null,
    });

    render(<ProtectedRoute unauthenticatedElement={UnauthenticatedElement} />);

    expect(screen.getByTestId('mock-unauthenticated')).toBeInTheDocument();
  });

  it('renders Outlet when authenticated', () => {
    useAuth.mockReturnValue({
      isLoadingAuth: false,
      authChecked: true,
      isAuthenticated: true,
      authError: null,
    });

    render(<ProtectedRoute unauthenticatedElement={UnauthenticatedElement} />);

    expect(screen.getByTestId('mock-outlet')).toBeInTheDocument();
  });
});
