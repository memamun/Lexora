import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ChallengeMode from './ChallengeMode';

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

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('@/lib/wordData', () => ({
  ALL_WORDS: Array.from({ length: 30 }).map((_, i) => ({
    index: i,
    word: `WORD_${i}`,
    options: { A: `Correct_${i}`, B: `WrongB_${i}`, C: `WrongC_${i}`, D: `WrongD_${i}` },
    answer: "A",
    explanation: `Explanation_${i}`
  }))
}));

vi.mock('./TimerRing', () => ({
  default: () => <div data-testid="timer-ring">Timer</div>
}));

describe('ChallengeMode', () => {
  const mockRecordReview = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const getReviews = () => {
    return Array.from({ length: 20 }).map((_, i) => ({
      word_index: i,
      total_reviews: 2,
      correct_count: 1
    }));
  };

  it('renders correctly and displays the first question', () => {
    render(<ChallengeMode reviews={getReviews()} recordReview={mockRecordReview} onClose={mockOnClose} />);
    expect(screen.getByText('Challenge Mode')).toBeInTheDocument();
    const wordHeading = screen.getByRole('heading', { level: 2 });
    expect(wordHeading).toBeInTheDocument();
    expect(wordHeading.textContent).toMatch(/WORD_\d+/);
    expect(screen.getByText(/Exit/i)).toBeInTheDocument();
    expect(screen.getByText('1 / 20')).toBeInTheDocument();
  });

  it('handles answering a question correctly', () => {
    render(<ChallengeMode reviews={getReviews()} recordReview={mockRecordReview} onClose={mockOnClose} />);
    const wordHeading = screen.getByRole('heading', { level: 2 });
    const wordText = wordHeading.textContent;
    const index = parseInt(wordText.split('_')[1]);
    const correctBtn = screen.getByText(`Correct_${index}`);
    fireEvent.click(correctBtn);
    expect(mockRecordReview).toHaveBeenCalledWith(index, 'instant', expect.any(Number));
    expect(screen.getByText(`Explanation_${index}`)).toBeInTheDocument();
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);
    expect(screen.getByRole('heading', { level: 2 }).textContent).not.toBe(wordText);
  });

  it('handles answering a question incorrectly', () => {
    render(<ChallengeMode reviews={getReviews()} recordReview={mockRecordReview} onClose={mockOnClose} />);
    const wordHeading = screen.getByRole('heading', { level: 2 });
    const wordText = wordHeading.textContent;
    const index = parseInt(wordText.split('_')[1]);
    const wrongBtn = screen.getByText(`WrongB_${index}`);
    fireEvent.click(wrongBtn);
    expect(mockRecordReview).toHaveBeenCalledWith(index, 'forgot', expect.any(Number));
  });

  it('handles timeout when timer runs out', () => {
    render(<ChallengeMode reviews={getReviews()} recordReview={mockRecordReview} onClose={mockOnClose} />);
    const wordHeading = screen.getByRole('heading', { level: 2 });
    const wordText = wordHeading.textContent;
    const index = parseInt(wordText.split('_')[1]);
    act(() => {
      vi.advanceTimersByTime(15000);
    });
    expect(screen.getByText(/Time's up!/i)).toBeInTheDocument();
    expect(mockRecordReview).toHaveBeenCalledWith(index, 'forgot', 15000);
  });

  it('completes the challenge and shows results screen', () => {
    render(<ChallengeMode reviews={getReviews()} recordReview={mockRecordReview} onClose={mockOnClose} />);
    for (let i = 0; i < 20; i++) {
      const wordHeading = screen.getByRole('heading', { level: 2 });
      const wordText = wordHeading.textContent;
      const index = parseInt(wordText.split('_')[1]);
      const correctBtn = screen.getByText(`Correct_${index}`);
      fireEvent.click(correctBtn);
      if (i < 19) {
        const nextBtn = screen.getByRole('button', { name: /Next/i });
        fireEvent.click(nextBtn);
      } else {
        const resultsBtn = screen.getByRole('button', { name: /See Results/i });
        fireEvent.click(resultsBtn);
      }
    }
    expect(screen.getByText('Challenge Mode Complete')).toBeInTheDocument();
    expect(screen.getByText('20/20')).toBeInTheDocument();
  });

  it('allows retrying the challenge from results screen', () => {
    render(<ChallengeMode reviews={getReviews()} recordReview={mockRecordReview} onClose={mockOnClose} />);
    for (let i = 0; i < 20; i++) {
      const wordHeading = screen.getByRole('heading', { level: 2 });
      const index = parseInt(wordHeading.textContent.split('_')[1]);
      fireEvent.click(screen.getByText(`Correct_${index}`));
      fireEvent.click(screen.getByRole('button', { name: i < 19 ? /Next/i : /See Results/i }));
    }
    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));
    expect(screen.queryByText('Challenge Mode Complete')).not.toBeInTheDocument();
    expect(screen.getByText('Challenge Mode')).toBeInTheDocument();
    expect(screen.getByText('1 / 20')).toBeInTheDocument();
  });

  it('calls onClose when exit is clicked from quiz', () => {
    render(<ChallengeMode reviews={getReviews()} recordReview={mockRecordReview} onClose={mockOnClose} />);
    fireEvent.click(screen.getByText(/Exit/i));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when back is clicked from results', () => {
    render(<ChallengeMode reviews={getReviews()} recordReview={mockRecordReview} onClose={mockOnClose} />);
    for (let i = 0; i < 20; i++) {
      const wordHeading = screen.getByRole('heading', { level: 2 });
      const index = parseInt(wordHeading.textContent.split('_')[1]);
      fireEvent.click(screen.getByText(`Correct_${index}`));
      fireEvent.click(screen.getByRole('button', { name: i < 19 ? /Next/i : /See Results/i }));
    }
    fireEvent.click(screen.getByRole('button', { name: /Back/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
