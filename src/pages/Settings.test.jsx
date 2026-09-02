import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Settings from './Settings';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigation } from '@/lib/NavigationContext';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AuthContext
vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock ThemeContext
vi.mock('@/lib/ThemeContext', () => ({
  useTheme: vi.fn(),
}));

// Mock NavigationContext
vi.mock('@/lib/NavigationContext', () => ({
  useNavigation: vi.fn(),
}));

// Mock useToast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: vi.fn(),
}));

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  isFirebaseConfigured: false,
}));
vi.mock('firebase/app', () => ({
  getApp: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  writeBatch: vi.fn(),
  serverTimestamp: vi.fn(),
}));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
}));

// Mock subcomponents
vi.mock('@/components/settings/SettingsProfile', () => ({
  default: () => <div data-testid="settings-profile" />,
}));
vi.mock('@/components/settings/SettingsEngine', () => ({
  default: () => <div data-testid="settings-engine" />,
}));
vi.mock('@/components/settings/SettingsAccount', () => ({
  default: () => <div data-testid="settings-account" />,
}));
vi.mock('@/components/settings/SettingsVisual', () => ({
  default: () => <div data-testid="settings-visual" />,
}));
vi.mock('@/components/settings/SettingsSupport', () => ({
  default: ({ setShowBugModal }) => (
    <div data-testid="settings-support">
      <button onClick={() => setShowBugModal(true)}>Open Bug Report</button>
    </div>
  ),
}));
vi.mock('@/components/settings/BugReportModal', () => ({
  default: ({ showBugModal, setShowBugModal, bugText, setBugText, submitBug }) => {
    if (!showBugModal) return null;
    return (
      <div data-testid="bug-report-modal">
        <input
          data-testid="bug-input"
          value={bugText}
          onChange={(e) => setBugText(e.target.value)}
        />
        <button data-testid="submit-bug" onClick={submitBug}>Submit Bug</button>
        <button onClick={() => setShowBugModal(false)}>Close Bug Report</button>
      </div>
    );
  },
}));

describe('Settings Component', () => {
  const mockLogout = vi.fn();
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    useAuth.mockReturnValue({
      user: { email: 'test@example.com', uid: '123' },
      logout: mockLogout,
    });

    useTheme.mockReturnValue({
      themeMode: 'light',
      setThemeMode: vi.fn(),
    });

    useNavigation.mockReturnValue({
      openMobile: vi.fn(),
    });

    useToast.mockReturnValue({
      toast: mockToast,
    });

  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders successfully', () => {
    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByTestId('settings-profile')).toBeInTheDocument();
    expect(screen.getByTestId('settings-engine')).toBeInTheDocument();
    expect(screen.getByTestId('settings-account')).toBeInTheDocument();
    expect(screen.getByTestId('settings-visual')).toBeInTheDocument();
    expect(screen.getByTestId('settings-support')).toBeInTheDocument();
  });

  it('handles logout and navigates to home', async () => {
    mockLogout.mockResolvedValue();

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    const logoutBtn = screen.getByRole('button', { name: /Log out Account/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('enforces bug report cooldown', async () => {
    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    // Open bug report modal
    const openBugBtn = screen.getByRole('button', { name: /Open Bug Report/i });
    fireEvent.click(openBugBtn);

    // Wait for modal to render
    const bugModal = await screen.findByTestId('bug-report-modal');
    expect(bugModal).toBeInTheDocument();

    // Type bug description
    const bugInput = screen.getByTestId('bug-input');
    fireEvent.change(bugInput, { target: { value: 'This is a bug' } });

    // Submit first bug
    const submitBtn = screen.getByTestId('submit-bug');
    fireEvent.click(submitBtn);

    // Since isFirebaseConfigured is mocked to false, it skips firebase call
    // and just triggers the toast "Feedback Logged"
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Feedback Logged"
      }));
    });

    // Re-open modal
    fireEvent.click(openBugBtn);

    // Type another bug
    fireEvent.change(screen.getByTestId('bug-input'), { target: { value: 'Another bug' } });

    // Submit second bug immediately
    fireEvent.click(screen.getByTestId('submit-bug'));

    // Should hit rate limit
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Please wait",
        description: "You can submit one report per minute."
      }));
    });

    // Wait out the cooldown manually since fake timers interact poorly with async testing library waitFor
    const originalNow = Date.now;
    Date.now = vi.fn(() => originalNow() + 60001);

    // Submit again after 1 minute
    fireEvent.click(screen.getByTestId('submit-bug'));

    // Should succeed again
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Feedback Logged"
      }));
    });
  });
});
