import { describe, it, expect, vi } from 'vitest';
import { shuffle } from './utils';

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
    // Mock Math.random to return predictable values to verify shuffling logic
    // Math.random will return 0.99, 0.5, 0.1
    // Loop:
    // i=2, j=floor(0.99*3)=2 -> swap a[2] with a[2]
    // i=1, j=floor(0.5*2)=1 -> swap a[1] with a[1]

    const randomSpy = vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0.1);

    const original = [1, 2, 3];
    // i=2: j = floor(0.99 * 3) = 2. [a[2], a[2]] = [3, 3]. Array is [1, 2, 3]
    // i=1: j = floor(0.1 * 2) = 0. [a[1], a[0]] = [a[0], a[1]] -> swap index 1 and 0. Array is [2, 1, 3]

    const result = shuffle(original);

    expect(result).toEqual([2, 1, 3]);

    // Restore Math.random
    randomSpy.mockRestore();
  });
});
