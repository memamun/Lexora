import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { syncQuizResults } from './analytics';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';

// Mock Firebase dependencies
vi.mock('firebase/app', () => ({
  getApp: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn().mockReturnValue({}),
  doc: vi.fn().mockReturnValue('mock-doc-ref'),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn().mockReturnValue('mock-server-timestamp'),
}));

vi.mock('firebase/analytics', () => ({
  logEvent: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  analytics: {},
  auth: { currentUser: { uid: 'test-uid' } },
  isFirebaseConfigured: true,
}));

describe('analytics - syncQuizResults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should sync quiz results to Firestore correctly', async () => {
    const uid = 'test-uid';
    const quizAttempt = {
      level_number: 1,
      score: 100,
      total_questions: 10,
      correct_count: 10,
      wrong_word_indices: [],
      attempted_at: '2024-01-01T00:00:00Z',
    };

    await syncQuizResults(uid, quizAttempt);

    expect(doc).toHaveBeenCalledWith(
      expect.anything(),
      'users',
      uid,
      'quizResults',
      `1_${Date.now()}`
    );

    expect(setDoc).toHaveBeenCalledWith('mock-doc-ref', {
      level_number: 1,
      score: 100,
      total_questions: 10,
      correct_count: 10,
      wrong_word_indices: [],
      attempted_at: '2024-01-01T00:00:00Z',
      syncedAt: 'mock-server-timestamp',
    });
  });

  it('should exit early if uid is missing', async () => {
    const quizAttempt = { level_number: 1 };
    await syncQuizResults(null, quizAttempt);
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('should gracefully handle Firestore errors', async () => {
    const uid = 'test-uid';
    const quizAttempt = { level_number: 1 };

    setDoc.mockRejectedValue(new Error('Firestore error'));
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await syncQuizResults(uid, quizAttempt);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[Analytics] Failed to sync quiz results:',
      'Firestore error'
    );

    consoleWarnSpy.mockRestore();
  });
});
