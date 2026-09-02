import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Settings from './Settings';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('lucide-react', () => ({
  LogOut: () => <div data-testid="logout-icon" />,
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: vi.fn(),
}));

vi.mock('@/components/layout/PageHeader', () => ({
  default: ({ title }) => <div data-testid="page-header">{title}</div>,
}));

vi.mock('@/lib/ThemeContext', () => ({
  useTheme: vi.fn(),
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/NavigationContext', () => ({
  useNavigation: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  isFirebaseConfigured: true,
}));

const mockBatchCommit = vi.fn();
const mockSet = vi.fn();

vi.mock('firebase/app', () => ({
  getApp: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: mockSet,
    commit: mockBatchCommit,
  })),
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: { uid: 'user123', email: 'test@example.com' },
  })),
}));

vi.mock('@/components/settings/SettingsProfile', () => ({
  default: () => <div data-testid="settings-profile" />,
}));
vi.mock('@/components/settings/SettingsEngine', () => ({
  default: ({ handleTargetChange, handleSpacedRepetitionToggle, handleVoiceSpeedChange }) => (
    <div data-testid="settings-engine">
      <button data-testid="target-change" onClick={() => handleTargetChange('30')}>Target</button>
      <button data-testid="spaced-rep" onClick={handleSpacedRepetitionToggle}>Spaced</button>
      <button data-testid="voice-speed" onClick={() => handleVoiceSpeedChange('1.5')}>Speed</button>
    </div>
  ),
}));
vi.mock('@/components/settings/SettingsAccount', () => ({
  default: ({ copyEmail }) => (
    <div data-testid="settings-account">
      <button data-testid="copy-email" onClick={copyEmail}>Copy Email</button>
    </div>
  ),
}));
vi.mock('@/components/settings/SettingsVisual', () => ({
  default: () => <div data-testid="settings-visual" />,
}));
vi.mock('@/components/settings/SettingsSupport', () => ({
  default: ({ testSpeech, setShowBugModal }) => (
    <div data-testid="settings-support">
      <button data-testid="test-speech" onClick={testSpeech}>Test Speech</button>
      <button data-testid="show-bug-modal" onClick={() => setShowBugModal(true)}>Show Bug</button>
    </div>
  ),
}));
vi.mock('@/components/settings/BugReportModal', () => ({
  default: ({ showBugModal, submitBug, setBugText }) => (
    showBugModal ? (
      <div data-testid="bug-modal">
        <input data-testid="bug-input" onChange={(e) => setBugText(e.target.value)} />
        <button data-testid="submit-bug" onClick={submitBug}>Submit</button>
      </div>
    ) : null
  ),
}));

describe('Settings Page', () => {
  const mockLogout = vi.fn();
  const mockToast = vi.fn();
  const mockSetThemeMode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    useNavigate.mockReturnValue(mockNavigate);
    useToast.mockReturnValue({ toast: mockToast });
    useAuth.mockReturnValue({
      user: { uid: 'user123', email: 'test@example.com' },
      logout: mockLogout,
    });
    useTheme.mockReturnValue({
      themeMode: 'system',
      setThemeMode: mockSetThemeMode,
    });
    useNavigation.mockReturnValue({
      openMobile: vi.fn(),
    });

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'lexora-daily-target') return '20';
      if (key === 'lexora-spaced-repetition') return 'true';
      if (key === 'lexora-voice-speed') return '1.0';
      if (key === 'lexora-accent-color') return 'amber';
      return null;
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders standard layout elements', () => {
    render(<Settings />);
    expect(screen.getByTestId('page-header')).toBeInTheDocument();
    expect(screen.getByTestId('settings-profile')).toBeInTheDocument();
    expect(screen.getByTestId('settings-engine')).toBeInTheDocument();
    expect(screen.getByTestId('settings-account')).toBeInTheDocument();
    expect(screen.getByTestId('settings-visual')).toBeInTheDocument();
    expect(screen.getByTestId('settings-support')).toBeInTheDocument();
    expect(screen.getByText('Log out Account')).toBeInTheDocument();
  });

  it('handles logout flow', async () => {
    render(<Settings />);
    const logoutBtn = screen.getByText('Log out Account');
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('handles target change and storage persistence', () => {
    render(<Settings />);
    fireEvent.click(screen.getByTestId('target-change'));

    expect(localStorage.setItem).toHaveBeenCalledWith('lexora-daily-target', '30');
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Daily Goal Updated'
    }));
  });

  it('handles spaced repetition toggle', () => {
    render(<Settings />);
    fireEvent.click(screen.getByTestId('spaced-rep'));

    expect(localStorage.setItem).toHaveBeenCalledWith('lexora-spaced-repetition', 'false');
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Scheduling Mode Changed'
    }));
  });

  it('handles voice speed change', () => {
    render(<Settings />);
    fireEvent.click(screen.getByTestId('voice-speed'));

    expect(localStorage.setItem).toHaveBeenCalledWith('lexora-voice-speed', '1.5');
  });

  it('handles speech test logic', () => {
    const mockSpeak = vi.fn();
    const mockCancel = vi.fn();
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        speak: mockSpeak,
        cancel: mockCancel,
        getVoices: () => [{ lang: 'en-US' }],
      },
      writable: true,
      configurable: true
    });

    global.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text;
        this.rate = 1.0;
        this.voice = null;
      }
    };

    render(<Settings />);
    fireEvent.click(screen.getByTestId('test-speech'));

    expect(mockCancel).toHaveBeenCalled();
    expect(mockSpeak).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Audio Test Started'
    }));
  });

  it('handles unsupported speech test logic gracefully', () => {
    const originalSpeechSynthesis = window.speechSynthesis;
    delete window.speechSynthesis;

    render(<Settings />);
    fireEvent.click(screen.getByTestId('test-speech'));

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Speech Synthesis Unsupported'
    }));

    window.speechSynthesis = originalSpeechSynthesis;
  });

  it('copies email successfully', async () => {
    const mockWriteText = vi.fn().mockResolvedValue();
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    render(<Settings />);
    fireEvent.click(screen.getByTestId('copy-email'));

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('test@example.com');
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Copied to Clipboard'
      }));
    });
  });

  it('submits bug report successfully', async () => {
    mockBatchCommit.mockResolvedValueOnce();
    render(<Settings />);

    fireEvent.click(screen.getByTestId('show-bug-modal'));
    expect(screen.getByTestId('bug-modal')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('bug-input'), { target: { value: 'Test bug' } });
    fireEvent.click(screen.getByTestId('submit-bug'));

    await waitFor(() => {
      expect(mockSet).toHaveBeenCalledTimes(2);
      expect(mockBatchCommit).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Feedback Logged'
      }));
      expect(screen.queryByTestId('bug-modal')).not.toBeInTheDocument();
    });
  });

  it('applies rate limiting for bug reports', async () => {
    const originalNow = Date.now;
    let mockTime = 100000000;
    Date.now = vi.fn(() => mockTime);

    mockBatchCommit.mockResolvedValue();
    render(<Settings />);

    fireEvent.click(screen.getByTestId('show-bug-modal'));
    fireEvent.change(screen.getByTestId('bug-input'), { target: { value: 'Bug 1' } });
    fireEvent.click(screen.getByTestId('submit-bug'));

    await waitFor(() => {
      expect(mockBatchCommit).toHaveBeenCalledTimes(1);
    });
    mockBatchCommit.mockClear();
    mockToast.mockClear();

    mockTime = 100000000 + 30000;
    fireEvent.click(screen.getByTestId('show-bug-modal'));
    fireEvent.change(screen.getByTestId('bug-input'), { target: { value: 'Bug 2' } });
    fireEvent.click(screen.getByTestId('submit-bug'));

    await waitFor(() => {
      expect(mockBatchCommit).not.toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Please wait'
      }));
    });

    Date.now = originalNow;
  });
});
