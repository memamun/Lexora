import { useState, useEffect, useCallback } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine !== false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // Reset wasOffline after a delay
      setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}

export function useOnlineRetry(fn, retries = 3, delay = 1000) {
  return useCallback(async (...args) => {
    let lastError;
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn(...args);
      } catch (err) {
        lastError = err;
        if (i < retries) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    throw lastError;
  }, [fn, retries, delay]);
}
