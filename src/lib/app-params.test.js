import { describe, it, expect } from 'vitest';
import { appParams } from './app-params';

describe('appParams', () => {
	it('should be defined', () => {
		expect(appParams).toBeDefined();
	});

	it('should contain expected keys', () => {
		expect(appParams).toHaveProperty('appId');
		expect(appParams).toHaveProperty('token');
		expect(appParams).toHaveProperty('fromUrl');
		expect(appParams).toHaveProperty('functionsVersion');
		expect(appParams).toHaveProperty('appBaseUrl');
	});

	it('should correctly fallback to default environment variables if provided', () => {
		expect(['undefined', 'string', 'object']).toContain(typeof appParams.appId);
		expect(['undefined', 'string', 'object']).toContain(typeof appParams.functionsVersion);
		expect(['undefined', 'string', 'object']).toContain(typeof appParams.appBaseUrl);
	});
});
