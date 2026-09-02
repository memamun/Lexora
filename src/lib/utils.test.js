import { describe, it, expect, vi } from 'vitest';
import { cn, shuffle, buildMCQ } from './utils';

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
    it('should return a new array', () => {
      const original = [1, 2, 3, 4, 5];
      const result = shuffle(original);

      expect(result).not.toBe(original);
    });

    it('should not mutate the original array', () => {
      const original = [1, 2, 3, 4, 5];
      const originalCopy = [...original];
      shuffle(original);

      expect(original).toEqual(originalCopy);
    });

    it('should return an array of the same length', () => {
      const original = [1, 2, 3, 4, 5];
      const result = shuffle(original);

      expect(result.length).toBe(original.length);
    });

    it('should contain all the original elements', () => {
      const original = [1, 2, 3, 4, 5];
      const result = shuffle(original);

      const sortedOriginal = [...original].sort();
      const sortedResult = [...result].sort();

      expect(sortedResult).toEqual(sortedOriginal);
    });

    it('should handle an empty array', () => {
      const original = [];
      const result = shuffle(original);

      expect(result).toEqual([]);
      expect(result).not.toBe(original);
    });

    it('should handle an array with a single element', () => {
      const original = [42];
      const result = shuffle(original);

      expect(result).toEqual([42]);
      expect(result).not.toBe(original);
    });

    it('should randomly shuffle elements', () => {
      const maxUint32 = 0xffffffff + 1;
      const cryptoSpy = vi.spyOn(crypto, 'getRandomValues').mockImplementation((arr) => {
        if (cryptoSpy.mock.calls.length === 1) {
          arr[0] = 0.99 * maxUint32;
        } else {
          arr[0] = 0.1 * maxUint32;
        }
        return arr;
      });

      const original = [1, 2, 3];
      const result = shuffle(original);

      expect(result).toEqual([2, 1, 3]);

      cryptoSpy.mockRestore();
    });
  });

  describe('buildMCQ', () => {
    it('should build an MCQ object correctly with word options', () => {
      const mockWord = {
        word: 'TEST',
        answer: 'A',
        explanation: 'A test explanation',
        index: 42,
        options: {
          A: 'Correct Option',
          B: 'Wrong Option 1',
          C: 'Wrong Option 2',
          D: 'Wrong Option 3',
        },
      };

      const result = buildMCQ(mockWord);

      expect(result.word).toBe('TEST');
      expect(result.correct).toBe('Correct Option');
      expect(result.explanation).toBe('A test explanation');
      expect(result.index).toBe(42);
      expect(result.options.length).toBe(4);
      expect([...result.options].sort()).toEqual([
        'Correct Option',
        'Wrong Option 1',
        'Wrong Option 2',
        'Wrong Option 3',
      ].sort());
    });

    it('should handle missing options and use answer directly', () => {
      const mockWord = {
        word: 'TEST2',
        answer: 'Direct Answer',
        explanation: 'Another explanation',
        index: 10,
      };

      const result = buildMCQ(mockWord);

      expect(result.word).toBe('TEST2');
      expect(result.correct).toBe('Direct Answer');
      expect(result.explanation).toBe('Another explanation');
      expect(result.index).toBe(10);
      expect(result.options).toEqual([]);
    });
  });
});
