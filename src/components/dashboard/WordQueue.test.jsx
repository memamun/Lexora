import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import WordQueue from './WordQueue';
import { ALL_WORDS } from '@/lib/wordData';

// Mock ALL_WORDS to ensure predictable tests without relying on the huge original dataset
vi.mock('@/lib/wordData', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ALL_WORDS: [
      { index: 0, word: 'APPLE', difficulty: 'foundation' },
      { index: 1, word: 'BANANA', difficulty: 'intermediate' },
      { index: 2, word: 'CHERRY', difficulty: 'advanced' },
    ],
    DIFFICULTY_MAP: {
      foundation: { color: 'text-green-500' },
      intermediate: { color: 'text-yellow-500' },
      advanced: { color: 'text-red-500' },
    }
  };
});

describe('WordQueue Component', () => {
  const defaultProps = {
    dueWords: [],
    weakWords: [],
    nearForgetting: [],
  };

  const renderComponent = (props = {}) => {
    return render(
      <MemoryRouter>
        <WordQueue {...defaultProps} {...props} />
      </MemoryRouter>
    );
  };

  it('renders all section titles', () => {
    renderComponent();
    expect(screen.getByText('Due for Review')).toBeInTheDocument();
    expect(screen.getByText('Weak Words')).toBeInTheDocument();
    expect(screen.getByText('Near Forgetting')).toBeInTheDocument();
  });

  it('renders empty states when no words are provided', () => {
    renderComponent();
    expect(screen.getByText(/All caught up/i)).toBeInTheDocument();
    expect(screen.getByText(/No weak words detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Memory strong — nothing fading/i)).toBeInTheDocument();
  });

  it('renders words correctly from word_index', () => {
    renderComponent({
      dueWords: [{ word_index: 0 }],
      weakWords: [{ word_index: 1 }],
      nearForgetting: [{ word_index: 2 }],
    });

    expect(screen.getByText('APPLE')).toBeInTheDocument();
    expect(screen.getByText('BANANA')).toBeInTheDocument();
    expect(screen.getByText('CHERRY')).toBeInTheDocument();
  });

  it('renders words correctly from fallback string', () => {
    renderComponent({
      dueWords: [{ word: 'DATES' }],
    });
    expect(screen.getByText('DATES')).toBeInTheDocument();
  });

  it('filters out duplicate words based on word_index', () => {
    renderComponent({
      dueWords: [
        { word_index: 0 },
        { word_index: 0 },
        { word_index: 1 },
      ],
    });

    // APPLE should be rendered once
    expect(screen.getAllByText('APPLE').length).toBe(1);
    expect(screen.getByText('BANANA')).toBeInTheDocument();
  });

  it('renders overflow indicator when there are more than 18 words', () => {
    const manyWords = Array.from({ length: 20 }, (_, i) => ({ word: `WORD${i}`, id: `id${i}` }));

    renderComponent({ dueWords: manyWords });

    // Should display the overflow text "+2"
    expect(screen.getByText('+2')).toBeInTheDocument();

    // First 18 words should be visible
    expect(screen.getByText('WORD0')).toBeInTheDocument();
    expect(screen.getByText('WORD17')).toBeInTheDocument();

    // 19th and 20th words should not be in the document
    expect(screen.queryByText('WORD18')).not.toBeInTheDocument();
    expect(screen.queryByText('WORD19')).not.toBeInTheDocument();
  });
});
