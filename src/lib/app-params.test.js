import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the dynamic import of secure-storage. This must be done before importing app-params.
vi.mock('@/utils/secure-storage', () => ({
  setSecureItem: vi.fn().mockResolvedValue(),
  removeSecureItem: vi.fn().mockResolvedValue(),
}));

import { getAppParamValue } from './app-params';

describe('getAppParamValue', () => {
  let originalWindowLocation;
  let originalHistoryReplaceState;

  beforeEach(() => {
    originalWindowLocation = window.location;
    delete window.location;
    window.location = {
      search: '',
      pathname: '/test-path',
      hash: '#hash',
    };

    originalHistoryReplaceState = window.history.replaceState;
    window.history.replaceState = vi.fn();

    localStorage.clear();
  });

  afterEach(() => {
    window.location = originalWindowLocation;
    window.history.replaceState = originalHistoryReplaceState;
    vi.clearAllMocks();
  });

  it('should construct correct localStorage key via toSnakeCase', () => {
    window.location.search = '?myTestParam=hello';
    getAppParamValue('myTestParam');
    expect(localStorage.getItem('base44_my_test_param')).toBe('hello');
  });

  it('should retrieve a value from URL parameters and save it to localStorage', () => {
    window.location.search = '?test_param=test_value';
    const result = getAppParamValue('test_param');
    expect(result).toBe('test_value');
    expect(localStorage.getItem('base44_test_param')).toBe('test_value');
  });

  it('should call history.replaceState to remove the parameter from URL if removeFromUrl is true', () => {
    window.location.search = '?remove_me=value1&keep_me=value2';
    document.title = 'Test Title';

    const result = getAppParamValue('remove_me', { removeFromUrl: true });

    expect(result).toBe('value1');
    expect(window.history.replaceState).toHaveBeenCalledWith(
      {},
      'Test Title',
      '/test-path?keep_me=value2#hash'
    );
  });

  it('should handle removeFromUrl when there are no other parameters left', () => {
    window.location.search = '?only_me=value';

    getAppParamValue('only_me', { removeFromUrl: true });

    expect(window.history.replaceState).toHaveBeenCalledWith(
      {},
      document.title,
      '/test-path#hash'
    );
  });

  it('should fallback to defaultValue when parameter is not in URL, and save to localStorage', () => {
    const result = getAppParamValue('missing_param', { defaultValue: 'default' });
    expect(result).toBe('default');
    expect(localStorage.getItem('base44_missing_param')).toBe('default');
  });

  it('should fallback to existing localStorage value if neither URL param nor defaultValue exists', () => {
    localStorage.setItem('base44_existing_param', 'stored_value');
    const result = getAppParamValue('existing_param');
    expect(result).toBe('stored_value');
  });

  it('should return null when parameter is completely absent', () => {
    const result = getAppParamValue('completely_missing');
    expect(result).toBeNull();
  });
});
