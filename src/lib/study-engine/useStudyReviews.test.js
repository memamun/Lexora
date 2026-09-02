import { renderHook } from '@testing-library/react';
import { useStudyReviews } from './useStudyReviews';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/firebase', () => ({
  auth: null,
  googleProvider: null,
  analytics: null,
  performance: null,
  isFirebaseConfigured: false,
  signInWithGoogle: vi.fn(),
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  firebaseLogout: vi.fn(),
  onFirebaseAuthChange: vi.fn((cb) => { cb(null); return () => {}; })
}));

describe('useStudyReviews', () => {
  const reviews = [
    { word_index: 0, next_review: new Date(Date.now() - 10000).toISOString(), ease_factor: 2.5, interval: 1 },
    { word_index: 1, next_review: new Date(Date.now() + 10000).toISOString(), ease_factor: 2.0, interval: 3 }
  ];

  it('calculates due words correctly', () => {
    const { result } = renderHook(() => useStudyReviews({ reviews }));
    const dueWords = result.current.getDueWords;
    expect(dueWords.length).toBe(1);
    expect(dueWords[0].word_index).toBe(0);
  });

  it('calculates weak words correctly', () => {
    const { result } = renderHook(() => useStudyReviews({ reviews }));
    const weakWords = result.current.getWeakWords;
    // Both words have ease_factor < 2.6 and interval < 21
    expect(weakWords.length).toBe(2);
  });
});
