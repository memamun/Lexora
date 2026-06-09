import { describe, it, expect } from 'vitest';
import { cn, shuffle } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge basic classes', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('class1', true && 'class2', false && 'class3', undefined, null)).toBe('class1 class2');
    });

    it('should handle objects and arrays', () => {
      expect(cn(['class1', 'class2'], { class3: true, class4: false })).toBe('class1 class2 class3');
    });

    it('should resolve tailwind class conflicts', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });
  });

  describe('shuffle', () => {
    it('should return an array with the same length', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = shuffle(arr);
      expect(result.length).toBe(arr.length);
    });

    it('should contain the same elements as the original array', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = shuffle(arr);
      expect([...result].sort()).toEqual([...arr].sort());
    });

    it('should not mutate the original array', () => {
      const arr = [1, 2, 3, 4, 5];
      const arrCopy = [...arr];
      shuffle(arr);
      expect(arr).toEqual(arrCopy);
    });

    it('should return a new array instance', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = shuffle(arr);
      expect(result).not.toBe(arr);
    });

    it('should handle an empty array', () => {
      expect(shuffle([])).toEqual([]);
    });

    it('should handle a single-element array', () => {
      expect(shuffle([1])).toEqual([1]);
    });
  });
});
