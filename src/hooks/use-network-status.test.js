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

  it('should initialize with false if navigator.onLine is false', () => {
    const originalValue = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(false);
    expect(result.current.wasOffline).toBe(false);

    // Restore the original value
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: originalValue,
    });
  });

  it('should remove event listeners on unmount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useNetworkStatus());

    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
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
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it('should respect exponential backoff delay', async () => {
    vi.useFakeTimers();
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValueOnce('success');

    const { result } = renderHook(() => useOnlineRetry(mockFn, 3, 1000));

    const promise = result.current();

    // First call happens immediately and fails
    await vi.advanceTimersByTimeAsync(0);
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Wait for first retry delay: 1000 * 2^0 = 1000ms
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockFn).toHaveBeenCalledTimes(2);

    // Wait for second retry delay: 1000 * 2^1 = 2000ms
    await vi.advanceTimersByTimeAsync(2000);
    expect(mockFn).toHaveBeenCalledTimes(3);

    const res = await promise;
    expect(res).toBe('success');
  });
});
