import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import OfflineBanner from './OfflineBanner';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }) => <div className={className}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react to avoid importing SVGs if they cause issues
vi.mock('lucide-react', () => ({
  WifiOff: () => <svg data-testid="wifi-off-icon" />,
}));

describe('OfflineBanner', () => {
  beforeEach(() => {
    // Reset navigator.onLine to true before each test
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('initially renders nothing when online', () => {
    render(<OfflineBanner />);
    expect(screen.queryByText(/You're offline/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Back online/i)).not.toBeInTheDocument();
  });

  it('renders offline banner when offline event is dispatched', () => {
    render(<OfflineBanner />);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByText("You're offline. Some features may be limited.")).toBeInTheDocument();
    expect(screen.queryByText(/Back online/i)).not.toBeInTheDocument();
  });

  it('renders reconnected banner when online event is dispatched after being offline', () => {
    render(<OfflineBanner />);

    // Go offline first
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByText("You're offline. Some features may be limited.")).toBeInTheDocument();

    // Come back online
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.queryByText("You're offline. Some features may be limited.")).not.toBeInTheDocument();
    expect(screen.getByText("Back online. Syncing your progress...")).toBeInTheDocument();
  });

  it('hides the reconnected banner after 3 seconds', () => {
    render(<OfflineBanner />);

    // Go offline
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // Come back online
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.getByText("Back online. Syncing your progress...")).toBeInTheDocument();

    // Fast-forward 3 seconds
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText("Back online. Syncing your progress...")).not.toBeInTheDocument();
  });

  it('renders offline banner initially if navigator.onLine is false on mount', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true,
    });

    render(<OfflineBanner />);

    expect(screen.getByText("You're offline. Some features may be limited.")).toBeInTheDocument();
  });
});
