import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackDailyActivity } from './analytics';

vi.mock('firebase/analytics', () => ({
  logEvent: vi.fn(),
}));
vi.mock('firebase/app', () => ({
  getApp: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  increment: vi.fn(),
}));
vi.mock('@/lib/firebase', () => ({
  analytics: {},
  auth: {},
  isFirebaseConfigured: true,
}));

describe('Analytics - local storage errors', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should catch and log error when localStorage.setItem fails', () => {
    const error = new Error('Storage full');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw error;
    });

    trackDailyActivity({ reviewCount: 1, correct: true, responseTime: 1000 });

    expect(console.warn).toHaveBeenCalledWith(
      '[Analytics] Failed to save local daily:',
      'Storage full'
    );
  });
});
