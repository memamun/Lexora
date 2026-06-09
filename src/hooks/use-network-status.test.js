import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus, useOnlineRetry } from './use-network-status';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useNetworkStatus', () => {
  let originalOnLine;

  beforeEach(() => {
    originalOnLine = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: originalOnLine,
    });
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should initialize with true if navigator.onLine is true', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);
  });

  it('should handle offline event', () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.wasOffline).toBe(false);
  });

  it('should handle online event and reset wasOffline after delay', () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOnline).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);
  });
});

describe('useOnlineRetry', () => {
  it('should resolve immediately if function succeeds', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    const { result } = renderHook(() => useOnlineRetry(mockFn));

    const res = await result.current();
    expect(res).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValueOnce('success');

    const { result } = renderHook(() => useOnlineRetry(mockFn, 3, 10));

    const res = await result.current();
    expect(res).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should throw error after max retries', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useOnlineRetry(mockFn, 2, 10));

    await expect(result.current()).rejects.toThrow('fail');
    expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });
});
