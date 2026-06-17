import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAppParams } from './app-params';

describe('getAppParams - fromUrl sanitization', () => {
    beforeEach(() => {
        // Clear environment variables before each test to ensure predictable app_id, etc.
        vi.stubEnv('VITE_BASE44_APP_ID', 'test-app-id');
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        window.localStorage.clear();
        vi.restoreAllMocks();
    });

    const setLocation = ({ origin = 'http://localhost', href = 'http://localhost', search = '' }) => {
        const url = new URL(`${origin}${href.startsWith('/') ? href : '/'}${search}`);
        vi.stubGlobal('location', {
            origin,
            href: url.href,
            search,
            pathname: url.pathname,
            hash: url.hash,
            searchParams: url.searchParams
        });

        // Also stub history replaceState to prevent errors when getAppParamValue calls it
        vi.stubGlobal('history', {
            replaceState: vi.fn()
        });
        vi.stubGlobal('document', {
            title: 'test'
        });
    };

    it('retains a safe relative URL', () => {
        setLocation({ origin: 'http://localhost', search: '?from_url=/some/path' });
        const params = getAppParams();
        expect(params.fromUrl).toBe('/some/path');
    });

    it('retains a safe absolute URL matching origin', () => {
        setLocation({ origin: 'http://localhost', search: '?from_url=http://localhost/some/path' });
        const params = getAppParams();
        expect(params.fromUrl).toBe('http://localhost/some/path');
    });

    it('falls back to origin for a different origin (Open Redirect prevention)', () => {
        setLocation({ origin: 'http://localhost', search: '?from_url=https://evil.com/path' });
        const params = getAppParams();
        expect(params.fromUrl).toBe('http://localhost');
    });

    it('falls back to origin for unsafe protocol (javascript:)', () => {
        setLocation({ origin: 'http://localhost', search: '?from_url=javascript:alert(1)' });
        const params = getAppParams();
        expect(params.fromUrl).toBe('http://localhost');
    });

    it('falls back to origin for unsafe protocol (data:)', () => {
        setLocation({ origin: 'http://localhost', search: '?from_url=data:text/html,...' });
        const params = getAppParams();
        expect(params.fromUrl).toBe('http://localhost');
    });

    it('strips access_token from an absolute URL', () => {
        setLocation({ origin: 'http://localhost', search: '?from_url=http://localhost/path?access_token=123%26other=456' });
        const params = getAppParams();
        expect(params.fromUrl).toBe('http://localhost/path?other=456');
    });

    it('strips access_token from a relative URL', () => {
        setLocation({ origin: 'http://localhost', search: '?from_url=/path?access_token=123%26other=456' });
        const params = getAppParams();
        expect(params.fromUrl).toBe('/path?other=456');
    });

    it('falls back to origin for an invalid URL string', () => {
        // http://1.2.3.4.5 is invalid URL
        setLocation({ origin: 'http://localhost', search: '?from_url=http://1.2.3.4.5:invalid' });
        const params = getAppParams();
        expect(params.fromUrl).toBe('http://localhost');
    });
});
