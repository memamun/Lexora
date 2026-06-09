import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge classes correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2');
    });

    it('should merge tailwind classes appropriately', () => {
      expect(cn('p-4 p-2')).toBe('p-2');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should handle arrays and objects', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2');
      expect(cn({ class1: true, class2: false, class3: true })).toBe('class1 class3');
    });

    it('should ignore falsy values', () => {
      expect(cn('class1', null, undefined, '', 0, 'class2')).toBe('class1 class2');
    });
  });
});
