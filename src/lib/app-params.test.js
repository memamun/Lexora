import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAppParams } from './app-params';

describe('getAppParams fromUrl sanitization', () => {
	let originalWindowLocation;
	let mockStorage;

	beforeEach(() => {
		// Mock storage
		mockStorage = new Map();
		const localStorageMock = {
			getItem: vi.fn((key) => mockStorage.get(key) || null),
			setItem: vi.fn((key, val) => mockStorage.set(key, val)),
			removeItem: vi.fn((key) => mockStorage.delete(key)),
		};

		// Mock import.meta.env
		vi.stubEnv('VITE_BASE44_APP_ID', 'test-app-id');
		vi.stubEnv('VITE_BASE44_FUNCTIONS_VERSION', '1');
		vi.stubEnv('VITE_BASE44_APP_BASE_URL', 'http://localhost');

		originalWindowLocation = window.location;

		// Mock window.location
		delete window.location;
		window.location = {
			origin: 'https://example.com',
			href: 'https://example.com/path',
			search: '',
			pathname: '/path',
			hash: '',
		};

		// Mock history replaceState
		window.history.replaceState = vi.fn();

		// Set window localStorage
		Object.defineProperty(window, 'localStorage', {
			value: localStorageMock,
			writable: true
		});
	});

	afterEach(() => {
		window.location = originalWindowLocation;
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	const setUrlParams = (params) => {
		const searchParams = new URLSearchParams(params);
		window.location.search = `?${searchParams.toString()}`;
		window.location.href = `https://example.com/path${window.location.search}`;
	};

	it('returns window.location.origin for javascript: URIs', () => {
		setUrlParams({ from_url: 'javascript:alert(1)' });
		const params = getAppParams();
		expect(params.fromUrl).toBe('https://example.com');
	});

	it('returns window.location.origin for data: URIs', () => {
		setUrlParams({ from_url: 'data:text/html,<script>alert(1)</script>' });
		const params = getAppParams();
		expect(params.fromUrl).toBe('https://example.com');
	});

	it('returns window.location.origin if fromUrl has a different origin (Open Redirect)', () => {
		setUrlParams({ from_url: 'https://malicious.com/phishing' });
		const params = getAppParams();
		expect(params.fromUrl).toBe('https://example.com');
	});

	it('strips access_token from a relative fromUrl and preserves relative path', () => {
		setUrlParams({ from_url: '/dashboard?access_token=secret123&foo=bar' });
		const params = getAppParams();
		expect(params.fromUrl).toBe('/dashboard?foo=bar');
	});

	it('strips access_token from an absolute fromUrl with same origin', () => {
		setUrlParams({ from_url: 'https://example.com/dashboard?access_token=secret123&foo=bar' });
		const params = getAppParams();
		expect(params.fromUrl).toBe('https://example.com/dashboard?foo=bar');
	});

	it('returns origin for malformed invalid URLs', () => {
		setUrlParams({ from_url: 'http://%' }); // invalid URL causing parser to throw
		const params = getAppParams();
		expect(params.fromUrl).toBe('https://example.com');
	});

	it('uses fallbackUrl (current href) if no from_url is provided, stripping token from fallback', () => {
		setUrlParams({ access_token: 'secret123' });
		// current href will have access_token
		// fallbackUrl logic strips it
		const params = getAppParams();
		expect(params.fromUrl).toBe('https://example.com/path');
	});

	it('preserves valid relative fromUrl', () => {
		setUrlParams({ from_url: '/some-page#section' });
		const params = getAppParams();
		expect(params.fromUrl).toBe('/some-page#section');
	});

	it('preserves valid absolute fromUrl with same origin', () => {
		setUrlParams({ from_url: 'https://example.com/some-page#section' });
		const params = getAppParams();
		expect(params.fromUrl).toBe('https://example.com/some-page#section');
	});
});
