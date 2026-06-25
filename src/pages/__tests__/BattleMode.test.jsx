import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import BattleMode from '../BattleMode';
import { BrowserRouter } from 'react-router-dom';

// Mock the dependencies
vi.mock('@/lib/useStudyEngine', () => ({
  useStudyEngine: vi.fn(),
}));

vi.mock('@/lib/wordData', () => ({
  ALL_WORDS: [
    { word: 'Word1', answer: 'A', options: { A: 'Meaning1', B: 'Wrong1', C: 'Wrong2', D: 'Wrong3' }, difficulty: 1, index: 1 },
    { word: 'Word2', answer: 'A', options: { A: 'Meaning2', B: 'Wrong1', C: 'Wrong2', D: 'Wrong3' }, difficulty: 2, index: 2 },
    { word: 'Word3', answer: 'A', options: { A: 'Meaning3', B: 'Wrong1', C: 'Wrong2', D: 'Wrong3' }, difficulty: 3, index: 3 },
    { word: 'Word4', answer: 'A', options: { A: 'Meaning4', B: 'Wrong1', C: 'Wrong2', D: 'Wrong3' }, difficulty: 1, index: 4 },
  ],
  DIFFICULTY_MAP: {
    1: { label: 'Easy', color: 'text-green-500' },
    2: { label: 'Medium', color: 'text-yellow-500' },
    3: { label: 'Hard', color: 'text-red-500' },
  },
}));

vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    shuffle: vi.fn((arr) => [...arr]), // Identity function for deterministic tests
  };
});

vi.mock('@/lib/NavigationContext', () => ({
  useNavigation: () => ({ openMobile: vi.fn() }),
}));

// Provide a mock for framer-motion to avoid complex animation rendering in tests
vi.mock('framer-motion', async () => {
  const actual = await import('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }) => {
        // filter out framer-motion specific props to avoid warnings
        const { initial, animate, exit, transition, whileHover, whileTap, ...domProps } = props;
        return <div {...domProps}>{children}</div>;
      },
      button: ({ children, ...props }) => {
        const { initial, animate, exit, transition, whileHover, whileTap, ...domProps } = props;
        return <button {...domProps}>{children}</button>;
      },
    },
    AnimatePresence: ({ children }) => <>{children}</>,
  };
});

// Mock LexoraLogo to simplify
vi.mock('@/components/ui/LexoraLogo', () => ({
  default: ({ isLoading }) => <div data-testid="lexora-logo">{isLoading ? 'Loading Logo' : 'Logo'}</div>,
}));

import { useStudyEngine } from '@/lib/useStudyEngine';

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('BattleMode', () => {
  const mockRecordReview = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    useStudyEngine.mockReturnValue({
      loading: false,
      recordReview: mockRecordReview,
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders loading state when engine is loading', () => {
    useStudyEngine.mockReturnValue({ loading: true, recordReview: mockRecordReview });
    renderWithRouter(<BattleMode />);
    expect(screen.getByTestId('lexora-logo')).toHaveTextContent('Loading Logo');
  });

  it('renders select phase initially', () => {
    renderWithRouter(<BattleMode />);
    expect(screen.getByText('Battle Mode')).toBeInTheDocument();
    expect(screen.getByText('30-Second Sprint')).toBeInTheDocument();
    expect(screen.getByText('Sudden Death')).toBeInTheDocument();
    expect(screen.getByText('Adaptive Marathon')).toBeInTheDocument();
  });

  it('starts Sprint Mode, shows timer, and handles timeout', () => {
    renderWithRouter(<BattleMode />);

    const sprintBtn = screen.getByText('30-Second Sprint');
    fireEvent.click(sprintBtn);

    // Now in playing phase
    expect(screen.getByText('Word1')).toBeInTheDocument();
    expect(screen.getByText('30s')).toBeInTheDocument(); // Initial time
    expect(screen.getByText('0')).toBeInTheDocument(); // Initial score

    // Advance timer by 15 seconds
    act(() => {
      vi.advanceTimersByTime(15000);
    });
    expect(screen.getByText('15s')).toBeInTheDocument();

    // Advance to end
    act(() => {
      vi.advanceTimersByTime(15000);
    });

    // Should be in result phase
    expect(screen.getByText('Play Again')).toBeInTheDocument();
    expect(screen.getByText('Change Mode')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Score
  });

  it('handles correct answer in playing phase', () => {
    renderWithRouter(<BattleMode />);
    fireEvent.click(screen.getByText('30-Second Sprint'));

    // Question 1: Word1, Correct answer: Meaning1
    const correctOption = screen.getByText('Meaning1');
    fireEvent.click(correctOption);

    // Record review should be called with 'instant'
    expect(mockRecordReview).toHaveBeenCalledWith(1, 'instant', expect.any(Number));

    // Score should increase (base 1 + streak bonus)
    // Score update is async but we clicked correct, flash timeouts apply
    act(() => {
      vi.advanceTimersByTime(400); // Wait for flash timeout for correct answer
    });

    // Should go to next question (Word2)
    expect(screen.getByText('Word2')).toBeInTheDocument();

    // Streak should be visible (1x is not explicitly rendered, it only renders when >= 3, but score increases)
    // Wait for the score to update
    const scoreElement = screen.getByText('1'); // Base score for 1st correct
    expect(scoreElement).toBeInTheDocument();
  });

  it('handles incorrect answer in playing phase', () => {
    renderWithRouter(<BattleMode />);
    fireEvent.click(screen.getByText('30-Second Sprint'));

    // Click incorrect option for Word1 (Meaning2 is an incorrect option pulled from Word2)
    const incorrectOption = screen.getByText('Meaning2');
    fireEvent.click(incorrectOption);

    // Record review should be called with 'forgot'
    expect(mockRecordReview).toHaveBeenCalledWith(1, 'forgot', expect.any(Number));

    act(() => {
      vi.advanceTimersByTime(700); // Wait for flash timeout for wrong answer
    });

    // Moves to next question, score remains 0
    expect(screen.getByText('Word2')).toBeInTheDocument();
    expect(screen.getAllByText('0')[0]).toBeInTheDocument(); // Score
  });

  it('ends game immediately on incorrect answer in Sudden Death', () => {
    renderWithRouter(<BattleMode />);
    fireEvent.click(screen.getByText('Sudden Death'));

    // Click incorrect option
    const incorrectOption = screen.getByText('Meaning2');
    fireEvent.click(incorrectOption);

    act(() => {
      vi.advanceTimersByTime(700);
    });

    // Should immediately go to result screen
    expect(screen.getByText('Play Again')).toBeInTheDocument();
  });

  it('handles answering all questions', () => {
     renderWithRouter(<BattleMode />);
     fireEvent.click(screen.getByText('30-Second Sprint'));

     // ALL_WORDS length is 4 in mock.
     for(let i=1; i<=4; i++) {
        const correctOption = screen.getByText(`Meaning${i}`);
        fireEvent.click(correctOption);
        act(() => {
            vi.advanceTimersByTime(400);
        });
     }

     // After answering all 4, it should go to result screen
     expect(screen.getByText('Play Again')).toBeInTheDocument();
  });

  it('allows playing again from result screen', () => {
    renderWithRouter(<BattleMode />);
    fireEvent.click(screen.getByText('Sudden Death'));

    // Fail to go to results
    const incorrectOption = screen.getByText('Meaning2');
    fireEvent.click(incorrectOption);
    act(() => { vi.advanceTimersByTime(700); });

    // Click Play Again
    fireEvent.click(screen.getByText('Play Again'));

    // Should be back to playing Sudden Death
    expect(screen.getByText('Word1')).toBeInTheDocument();
    expect(screen.queryByText('Play Again')).not.toBeInTheDocument();
  });

  it('allows changing mode from result screen', () => {
    renderWithRouter(<BattleMode />);
    fireEvent.click(screen.getByText('Sudden Death'));

    // Fail to go to results
    const incorrectOption = screen.getByText('Meaning2');
    fireEvent.click(incorrectOption);
    act(() => { vi.advanceTimersByTime(700); });

    // Click Change Mode
    fireEvent.click(screen.getByText('Change Mode'));

    // Should be back to selection screen
    expect(screen.getByText('30-Second Sprint')).toBeInTheDocument();
  });
});
