import { describe, it, expect } from 'vitest';
import { cn, isIframe, shuffle } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges tailwind classes properly', () => {
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });

    it('handles conditional classes', () => {
      expect(cn('text-lg', true && 'font-bold', false && 'italic')).toBe('text-lg font-bold');
    });

    it('handles objects and arrays', () => {
      expect(cn(['text-sm', 'text-center'], { 'bg-black': true, 'bg-white': false })).toBe('text-sm text-center bg-black');
    });

    it('handles undefined and null gracefully', () => {
      expect(cn('p-4', null, undefined, 'm-4')).toBe('p-4 m-4');
    });
  });

  describe('isIframe', () => {
    it('is a boolean', () => {
      // Because we run in jsdom and jsdom might mock window properties,
      // it should evaluate to a boolean
      expect(typeof isIframe).toBe('boolean');
    });
  });

  describe('shuffle', () => {
    it('returns a new array', () => {
      const original = [1, 2, 3];
      const result = shuffle(original);
      expect(result).not.toBe(original);
    });

    it('contains the same elements', () => {
      const original = [1, 2, 3, 4, 5];
      const result = shuffle(original);
      expect(result.length).toBe(original.length);
      // Ensure all elements from original exist in result
      expect([...result].sort()).toEqual([...original].sort());
    });

    it('works with an empty array', () => {
      expect(shuffle([])).toEqual([]);
    });

    it('works with a single element array', () => {
      expect(shuffle([42])).toEqual([42]);
    });
  });
});
