import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AppShell from './AppShell';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import * as AuthContext from '@/lib/AuthContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' }),
  };
});

const mockCloseMobile = vi.fn();
const mockToggleSidebar = vi.fn();
const mockLogout = vi.fn();

vi.mock('@/lib/NavigationContext', () => ({
  useNavigation: () => ({
    mobileOpen: false,
    closeMobile: mockCloseMobile,
    sidebarCollapsed: false,
    toggleSidebar: mockToggleSidebar
  })
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('@/lib/ThemeContext', () => ({
  useTheme: () => ({ themeMode: 'dark', setThemeMode: vi.fn() })
}));

// Provide a fully mocked motion object and mock LexoraLogo
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    motion: {
      div: ({ layoutId, ...props }) => <div {...props} />,
      button: ({ layoutId, ...props }) => <button {...props} />,
      nav: ({ layoutId, ...props }) => <nav {...props} />,
      aside: ({ layoutId, ...props }) => <aside {...props} />,
      span: ({ layoutId, ...props }) => <span {...props} />,
      svg: ({ layoutId, ...props }) => <svg {...props} />,
      path: ({ layoutId, ...props }) => <path {...props} />,
      g: ({ layoutId, ...props }) => <g {...props} />,
      rect: ({ layoutId, ...props }) => <rect {...props} />,
      defs: ({ layoutId, ...props }) => <defs {...props} />,
      linearGradient: ({ layoutId, ...props }) => <linearGradient {...props} />,
      stop: ({ layoutId, ...props }) => <stop {...props} />
    },
    AnimatePresence: ({ children }) => <>{children}</>
  };
});

vi.mock('@/components/ui/LexoraLogo', () => ({
  __esModule: true,
  default: () => <div data-testid="lexora-logo">LexoraLogoMock</div>
}));

describe('AppShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AuthContext.useAuth.mockReturnValue({
      user: { name: 'Test User', email: 'test@example.com', role: 'user' },
      logout: mockLogout
    });
  });

  it('renders standard layout elements correctly', () => {
    render(
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    );

    // Header/Sidebar rendering
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Study Roadmap').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Word Dictionary').length).toBeGreaterThan(0);

    // User info
    expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
    expect(screen.getAllByText('test@example.com').length).toBeGreaterThan(0);
  });

  it('renders admin nav items when user is admin', () => {
    AuthContext.useAuth.mockReturnValue({
      user: { name: 'Admin', email: 'admin@example.com', role: 'admin' },
      logout: mockLogout
    });

    render(
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    );

    expect(screen.getAllByText('Administration').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Admin Panel').length).toBeGreaterThan(0);
  });

  it('calls toggleSidebar when toggle button is clicked', () => {
    render(
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    );

    const toggleButton = screen.getByTitle('Collapse Sidebar');
    fireEvent.click(toggleButton);

    expect(mockToggleSidebar).toHaveBeenCalled();
  });

  it('calls logout when sign out is clicked', async () => {
    render(
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    );

    // There might be multiple sign out buttons (desktop sidebar vs mobile drawer)
    const signoutButtons = screen.getAllByLabelText('Sign out');
    fireEvent.click(signoutButtons[0]);

    // Check if logout was called
    expect(mockLogout).toHaveBeenCalled();
  });
});
