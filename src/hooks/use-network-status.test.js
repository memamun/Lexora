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
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should resolve immediately if function succeeds', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    const { result } = renderHook(() => useOnlineRetry(mockFn));

    const promise = result.current();
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should apply exponential backoff correctly and eventually succeed', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockRejectedValueOnce(new Error('fail 3'))
      .mockResolvedValueOnce('success');

    const { result } = renderHook(() => useOnlineRetry(mockFn, 3, 1000));

    const promise = result.current();

    await Promise.resolve(); // flush initial call
    expect(mockFn).toHaveBeenCalledTimes(1);

    // First retry delay: 1000ms
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockFn).toHaveBeenCalledTimes(2);

    // Second retry delay: 2000ms
    await vi.advanceTimersByTimeAsync(2000);
    expect(mockFn).toHaveBeenCalledTimes(3);

    // Third retry delay: 4000ms
    await vi.advanceTimersByTimeAsync(4000);
    expect(mockFn).toHaveBeenCalledTimes(4);

    const res = await promise;
    expect(res).toBe('success');
  });

  it('should throw error after max retries with proper delays', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useOnlineRetry(mockFn, 2, 1000));

    let error;
    const promise = result.current().catch(e => { error = e; });

    await Promise.resolve();
    expect(mockFn).toHaveBeenCalledTimes(1);

    // First retry: 1000ms
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockFn).toHaveBeenCalledTimes(2);

    // Second retry: 2000ms
    await vi.advanceTimersByTimeAsync(2000);
    expect(mockFn).toHaveBeenCalledTimes(3);

    await promise;
    expect(error.message).toBe('fail');
  });
});
