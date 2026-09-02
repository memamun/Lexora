import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('analytics.js', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('should handle Firestore initialization errors gracefully', async () => {
    vi.doMock('firebase/app', () => ({
      getApp: vi.fn(),
    }));

    vi.doMock('firebase/firestore', async (importOriginal) => {
      const actual = await importOriginal();
      return {
        ...actual,
        getFirestore: vi.fn().mockImplementation(() => {
          throw new Error('Mocked Firestore init failure');
        }),
        doc: vi.fn(),
        setDoc: vi.fn(),
        serverTimestamp: vi.fn(),
        increment: vi.fn(),
      };
    });

    vi.doMock('@/lib/firebase', () => ({
      analytics: {},
      auth: {},
      isFirebaseConfigured: true,
    }));

    vi.doMock('firebase/analytics', () => ({
      logEvent: vi.fn(),
    }));

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Dynamically import the module so the new mocks take effect and local variables are reset
    const { syncLevelProgress } = await import('./analytics.js');

    // Call syncLevelProgress which uses getDb internally
    await syncLevelProgress('user123', []);

    // Verify console.warn was called with the exact message from getDb
    expect(consoleWarnSpy).toHaveBeenCalledWith('[Analytics] Firestore not available:', 'Mocked Firestore init failure');

    consoleWarnSpy.mockRestore();
  });
});
