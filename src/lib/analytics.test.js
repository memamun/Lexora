import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { syncLevelProgress } from './analytics';
import { getFirestore, doc } from 'firebase/firestore';
import { getApp } from 'firebase/app';

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

vi.mock('firebase/analytics', () => ({
  logEvent: vi.fn(),
}));

describe('analytics', () => {
  let consoleWarnSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should handle Firestore initialization errors gracefully in getDb', async () => {
    getFirestore.mockImplementation(() => {
      throw new Error('Firestore init failed');
    });

    await syncLevelProgress('test-uid', []);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[Analytics] Firestore not available:',
      'Firestore init failed'
    );
    expect(doc).not.toHaveBeenCalled();
  });

  it('should handle getApp initialization errors gracefully in getDb', async () => {
    getApp.mockImplementation(() => {
      throw new Error('App init failed');
    });

    await syncLevelProgress('test-uid', []);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[Analytics] Firestore not available:',
      'App init failed'
    );
    expect(doc).not.toHaveBeenCalled();
  });
});
