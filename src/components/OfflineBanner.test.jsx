import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import OfflineBanner from './OfflineBanner';

// Mock framer-motion so we don't have to wait for AnimatePresence exit animations
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: {
      div: ({ children, className }) => <div className={className}>{children}</div>
    }
  };
});

describe('OfflineBanner', () => {
  let originalNavigatorOnLine;

  beforeEach(() => {
    vi.useFakeTimers();
    originalNavigatorOnLine = navigator.onLine;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'onLine', {
      value: originalNavigatorOnLine,
      configurable: true,
    });
  });

  const setOnlineStatus = (status) => {
    Object.defineProperty(navigator, 'onLine', {
      value: status,
      configurable: true,
    });
  };

  it('renders nothing when initially online', () => {
    setOnlineStatus(true);
    render(<OfflineBanner />);

    expect(screen.queryByText(/You're offline/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Back online/i)).not.toBeInTheDocument();
  });

  it('renders offline banner when initially offline', () => {
    setOnlineStatus(false);
    render(<OfflineBanner />);

    expect(screen.getByText(/You're offline/i)).toBeInTheDocument();
    expect(screen.queryByText(/Back online/i)).not.toBeInTheDocument();
  });

  it('responds to offline event by showing the offline banner', () => {
    setOnlineStatus(true);
    render(<OfflineBanner />);

    expect(screen.queryByText(/You're offline/i)).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByText(/You're offline/i)).toBeInTheDocument();
  });

  it('responds to online event by showing reconnected banner, then hides it after 3 seconds', async () => {
    setOnlineStatus(false);
    render(<OfflineBanner />);

    // Initially offline
    expect(screen.getByText(/You're offline/i)).toBeInTheDocument();

    // Go online
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    // Offline banner goes away, reconnected banner appears
    expect(screen.queryByText(/You're offline/i)).not.toBeInTheDocument();
    const banner = screen.getByText(/Back online. Syncing your progress.../i);
    expect(banner).toBeInTheDocument();

    // Fast forward 3 seconds
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Check it's removed
    expect(screen.queryByText(/Back online/i)).not.toBeInTheDocument();
  });

  it('cleans up event listeners on unmount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<OfflineBanner />);

    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});
