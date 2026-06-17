import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncLevelProgress } from './analytics';

const mockSetDoc = vi.fn();
const mockDoc = vi.fn((db, coll, id) => ({ path: `${coll}/${id}` }));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => 'mock-db'),
  doc: (...args) => mockDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  serverTimestamp: vi.fn(),
  increment: vi.fn()
}));

vi.mock('firebase/app', () => ({
  getApp: vi.fn()
}));

vi.mock('firebase/analytics', () => ({
  logEvent: vi.fn()
}));

// We'll mock isFirebaseConfigured explicitly so we can toggle it
let mockIsFirebaseConfigured = true;

vi.mock('@/lib/firebase', () => ({
  analytics: {},
  auth: {},
  get isFirebaseConfigured() {
    return mockIsFirebaseConfigured;
  }
}));

describe('syncLevelProgress', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockIsFirebaseConfigured = true;
  });

  it('should return early if uid is not provided', async () => {
    await syncLevelProgress(null, []);
    expect(mockDoc).not.toHaveBeenCalled();
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('should properly map level progress and call setDoc', async () => {
    const uid = 'test-uid';
    const levelProgress = [
      {
        level_number: 1,
        is_unlocked: true,
        is_completed: true,
        quiz_score: 90,
        words_studied: 10
      },
      {
        level_number: 2,
        is_unlocked: true
        // other fields missing, should default
      }
    ];

    await syncLevelProgress(uid, levelProgress);

    expect(mockDoc).toHaveBeenCalledWith('mock-db', 'users', 'test-uid');
    expect(mockSetDoc).toHaveBeenCalledWith(
      { path: 'users/test-uid' },
      {
        levelProgress: {
          level_1: {
            is_unlocked: true,
            is_completed: true,
            quiz_score: 90,
            words_studied: 10
          },
          level_2: {
            is_unlocked: true,
            is_completed: false,
            quiz_score: 0,
            words_studied: 0
          }
        }
      },
      { merge: true }
    );
  });

  it('should gracefully handle errors', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockSetDoc.mockRejectedValueOnce(new Error('Test error'));

    const uid = 'test-uid';
    await syncLevelProgress(uid, [{ level_number: 1 }]);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[Analytics] Failed to sync level progress:',
      'Test error'
    );

    consoleWarnSpy.mockRestore();
  });
});
