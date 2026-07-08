import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { syncLevelProgress } from './analytics';
import { getFirestore, doc } from 'firebase/firestore';

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
  firestoreDb: {},
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

  it('should handle Firestore not being configured gracefully in getDb', async () => {
    const firebaseMock = await import('@/lib/firebase');
    firebaseMock.firestoreDb = null;

    await syncLevelProgress('test-uid', []);

    expect(doc).not.toHaveBeenCalled();
  });
});
