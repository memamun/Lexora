import { describe, it, expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { queryClientInstance } from './query-client';

describe('queryClientInstance', () => {
	it('should be an instance of QueryClient', () => {
		expect(queryClientInstance).toBeInstanceOf(QueryClient);
	});

	it('should have the correct default queries options', () => {
		const defaultOptions = queryClientInstance.getDefaultOptions();

		expect(defaultOptions.queries.refetchOnWindowFocus).toBe(false);
		expect(defaultOptions.queries.retry).toBe(2);
		expect(defaultOptions.queries.staleTime).toBe(5 * 60 * 1000);
		expect(defaultOptions.queries.gcTime).toBe(10 * 60 * 1000);
	});

	it('should calculate exponential retryDelay for queries correctly', () => {
		const defaultOptions = queryClientInstance.getDefaultOptions();
		const retryDelayFn = defaultOptions.queries.retryDelay;

		expect(typeof retryDelayFn).toBe('function');

		// 1000 * 2^0 = 1000
		expect(retryDelayFn(0)).toBe(1000);
		// 1000 * 2^1 = 2000
		expect(retryDelayFn(1)).toBe(2000);
		// 1000 * 2^2 = 4000
		expect(retryDelayFn(2)).toBe(4000);
		// 1000 * 2^3 = 8000
		expect(retryDelayFn(3)).toBe(8000);
		// 1000 * 2^4 = 16000
		expect(retryDelayFn(4)).toBe(16000);

		// Cap at 30000
		// 1000 * 2^5 = 32000 => 30000
		expect(retryDelayFn(5)).toBe(30000);
		expect(retryDelayFn(10)).toBe(30000);
	});

	it('should have the correct default mutations options', () => {
		const defaultOptions = queryClientInstance.getDefaultOptions();

		expect(defaultOptions.mutations.retry).toBe(1);
		expect(defaultOptions.mutations.retryDelay).toBe(1000);
	});
});
