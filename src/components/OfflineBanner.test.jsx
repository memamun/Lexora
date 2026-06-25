import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import OfflineBanner from './OfflineBanner';

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: {
      ...actual.motion,
      div: ({ children, className }) => <div className={className}>{children}</div>
    }
  };
});

describe('OfflineBanner', () => {
  let originalOnLine;

  beforeEach(() => {
    vi.useFakeTimers();
    originalOnLine = navigator.onLine;
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      configurable: true
    });
  });

  const setOnline = (isOnline) => {
    Object.defineProperty(navigator, 'onLine', {
      value: isOnline,
      configurable: true
    });
  };

  it('does not render anything when online on mount', () => {
    setOnline(true);
    render(<OfflineBanner />);

    expect(screen.queryByText(/You're offline/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Back online/i)).not.toBeInTheDocument();
  });

  it('renders offline banner when offline on mount', () => {
    setOnline(false);
    render(<OfflineBanner />);

    expect(screen.getByText(/You're offline/i)).toBeInTheDocument();
    expect(screen.queryByText(/Back online/i)).not.toBeInTheDocument();
  });

  it('shows offline banner when offline event is fired', () => {
    setOnline(true);
    render(<OfflineBanner />);

    expect(screen.queryByText(/You're offline/i)).not.toBeInTheDocument();

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByText(/You're offline/i)).toBeInTheDocument();
  });

  it('hides offline banner and shows reconnected banner when online event is fired, then hides it after 3s', () => {
    setOnline(false);
    render(<OfflineBanner />);

    expect(screen.getByText(/You're offline/i)).toBeInTheDocument();

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.queryByText(/You're offline/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Back online. Syncing your progress/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText(/Back online. Syncing your progress/i)).not.toBeInTheDocument();
  });
});
