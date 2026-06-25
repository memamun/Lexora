import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ChallengeMode from './ChallengeMode';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Timer: () => <div data-testid="icon-timer" />,
  Zap: () => <div data-testid="icon-zap" />,
  CheckCircle2: () => <div data-testid="icon-check" />,
  XCircle: () => <div data-testid="icon-x" />,
  ChevronRight: () => <div data-testid="icon-chevron-right" />,
  RotateCcw: () => <div data-testid="icon-rotate-ccw" />,
  ArrowLeft: () => <div data-testid="icon-arrow-left" />,
  Flame: () => <div data-testid="icon-flame" />,
  Trophy: () => <div data-testid="icon-trophy" />
}));

// Mock timer ring to avoid animation complications
vi.mock('./ChallengeMode', async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
  };
});

// Mock ALL_WORDS statically
vi.mock('@/lib/wordData', () => {
  const words = [];
  for (let i = 0; i < 25; i++) {
    words.push({
      index: i,
      word: `WORD${i}`,
      answer: "B",
      options: { A: "OptA", B: "OptB", C: "OptC", D: "OptD" },
      explanation: `Explanation for WORD${i}`
    });
  }
  return { ALL_WORDS: words };
});

describe('ChallengeMode', () => {
  const mockRecordReview = vi.fn().mockResolvedValue();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    mockRecordReview.mockClear();
    mockOnClose.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const generateMockReviews = (count = 5) => {
    return Array.from({ length: count }, (_, i) => ({
      word_index: i,
      total_reviews: 2,
      correct_count: 1
    }));
  };

  it('renders loading or initial state correctly', () => {
    const reviews = generateMockReviews(25);
    render(<ChallengeMode reviews={reviews} recordReview={mockRecordReview} onClose={mockOnClose} />);

    // Check header elements
    expect(screen.getByText('Challenge Mode')).toBeInTheDocument();
    expect(screen.getByText('Exit')).toBeInTheDocument();

    // Check initial question info
    expect(screen.getByText('1 / 20')).toBeInTheDocument();

    // Check options are rendered (we have 4 options per question)
    const options = screen.getAllByRole('button').filter(b =>
      b.textContent.includes('OptA') || b.textContent.includes('OptB') ||
      b.textContent.includes('OptC') || b.textContent.includes('OptD')
    );
    expect(options).toHaveLength(4);
  });

  it('handles a correct answer', async () => {
    const reviews = generateMockReviews(25);
    render(<ChallengeMode reviews={reviews} recordReview={mockRecordReview} onClose={mockOnClose} />);

    // Click correct answer ('OptB')
    const correctBtn = screen.getByText('OptB').closest('button');
    fireEvent.click(correctBtn);

    // Verify recordReview was called with 'instant'
    expect(mockRecordReview).toHaveBeenCalledWith(expect.any(Number), 'instant', expect.any(Number));

    // Check that combo appears (not immediately maybe, but score does)
    // "1 checkmark"
    expect(screen.getByText('1 checkmark')).toBeInTheDocument();

    // Check explanation shows up
    expect(screen.getByText(/Explanation for WORD/)).toBeInTheDocument();

    // Advance to next question
    const nextBtn = screen.getByText('Next');
    fireEvent.click(nextBtn);

    expect(screen.getByText('2 / 20')).toBeInTheDocument();
  });

  it('handles an incorrect answer', async () => {
    const reviews = generateMockReviews(25);
    render(<ChallengeMode reviews={reviews} recordReview={mockRecordReview} onClose={mockOnClose} />);

    // Click wrong answer ('OptA')
    const wrongBtn = screen.getByText('OptA').closest('button');
    fireEvent.click(wrongBtn);

    // Verify recordReview was called with 'forgot'
    expect(mockRecordReview).toHaveBeenCalledWith(expect.any(Number), 'forgot', expect.any(Number));

    // Score should remain 0
    expect(screen.getByText('0 checkmark')).toBeInTheDocument();

    // Advance to next question
    const nextBtn = screen.getByText('Next');
    fireEvent.click(nextBtn);

    expect(screen.getByText('2 / 20')).toBeInTheDocument();
  });

  it('handles timeout correctly', async () => {
    const reviews = generateMockReviews(25);
    render(<ChallengeMode reviews={reviews} recordReview={mockRecordReview} onClose={mockOnClose} />);

    // Fast-forward 15 seconds (TIME_LIMIT)
    act(() => {
      vi.advanceTimersByTime(16000);
    });

    // Time's up message should appear
    expect(screen.getByText(/Time's up! The answer was:/)).toBeInTheDocument();

    // recordReview should have been called with 'forgot' and 15000 duration
    expect(mockRecordReview).toHaveBeenCalledWith(expect.any(Number), 'forgot', 15000);

    // Click Next
    const nextBtn = screen.getByText('Next');
    fireEvent.click(nextBtn);

    expect(screen.getByText('2 / 20')).toBeInTheDocument();
  });

  it('shows result screen after all questions and handles retry/close', async () => {
    // Only 1 review so pool handles filling with new words to reach 20
    const reviews = generateMockReviews(1);
    render(<ChallengeMode reviews={reviews} recordReview={mockRecordReview} onClose={mockOnClose} />);

    // Answer all 20 questions
    for (let i = 0; i < 20; i++) {
      const btn = screen.getByText('OptB').closest('button');
      fireEvent.click(btn);

      const nextBtnText = i === 19 ? 'See Results' : 'Next';
      const nextBtn = screen.getByText(nextBtnText);
      fireEvent.click(nextBtn);
    }

    // Should be on result screen
    expect(screen.getByText('Challenge Mode Complete')).toBeInTheDocument();

    // Verify score is 20
    expect(screen.getByText('20/20')).toBeInTheDocument(); // 20 correct answers

    // Try Again
    const retryBtn = screen.getByText('Try Again').closest('button');
    fireEvent.click(retryBtn);

    // Should be back to question 1
    expect(screen.getByText('1 / 20')).toBeInTheDocument();

    // Close from inside
    const exitBtn = screen.getByText('Exit').closest('button');
    fireEvent.click(exitBtn);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes properly from result screen', async () => {
    const reviews = generateMockReviews(1);
    render(<ChallengeMode reviews={reviews} recordReview={mockRecordReview} onClose={mockOnClose} />);

    // Answer all 20 questions to get to result screen
    for (let i = 0; i < 20; i++) {
      const btn = screen.getByText('OptB').closest('button');
      fireEvent.click(btn);
      const nextBtn = screen.getByText(i === 19 ? 'See Results' : 'Next');
      fireEvent.click(nextBtn);
    }

    const backBtn = screen.getByText('Back').closest('button');
    fireEvent.click(backBtn);
    expect(mockOnClose).toHaveBeenCalled();
  });
});
