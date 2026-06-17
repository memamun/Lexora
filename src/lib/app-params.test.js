import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('appParams', () => {
  let originalLocation;

  beforeEach(() => {
    vi.resetModules();
    originalLocation = window.location;
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true
    });
    vi.clearAllMocks();
  });

  it('gracefully ignores invalid URL when parsing fallbackUrl', async () => {
    // Override window.location to an invalid URL, which will naturally cause new URL() to throw
    Object.defineProperty(window, 'location', {
        value: {
            ...originalLocation,
            href: 'invalid-url', // This will throw when passed to new URL()
            origin: 'http://localhost'
        },
        writable: true
    });

    // Import the module which evaluates getAppParams() inline
    let errorCaught = null;
    let appParamsModule;
    try {
        appParamsModule = await import('./app-params');
    } catch(e) {
        errorCaught = e;
    }

    expect(errorCaught).toBeNull();
    expect(appParamsModule).toBeDefined();
    expect(appParamsModule.appParams).toBeDefined();
  });
});
