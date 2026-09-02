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
    expect(screen.getByText('Challenge Mode')).toBeInTheDocument();
    expect(screen.getByText('Exit')).toBeInTheDocument();
    expect(screen.getByText('1 / 20')).toBeInTheDocument();
    const options = screen.getAllByRole('button').filter(b =>
      b.textContent.includes('OptA') || b.textContent.includes('OptB') ||
      b.textContent.includes('OptC') || b.textContent.includes('OptD')
    );
    expect(options).toHaveLength(4);
  });

  it('handles a correct answer', async () => {
    const reviews = generateMockReviews(25);
    render(<ChallengeMode reviews={reviews} recordReview={mockRecordReview} onClose={mockOnClose} />);
    const correctBtn = screen.getByText('OptB').closest('button');
    fireEvent.click(correctBtn);
    expect(mockRecordReview).toHaveBeenCalledWith(expect.any(Number), 'instant', expect.any(Number));
    expect(screen.getByText('1 checkmark')).toBeInTheDocument();
    expect(screen.getByText(/Explanation for WORD/)).toBeInTheDocument();
    const nextBtn = screen.getByText('Next');
    fireEvent.click(nextBtn);
    expect(screen.getByText('2 / 20')).toBeInTheDocument();
  });

  it('handles an incorrect answer', async () => {
    const reviews = generateMockReviews(25);
    render(<ChallengeMode reviews={reviews} recordReview={mockRecordReview} onClose={mockOnClose} />);
    const wrongBtn = screen.getByText('OptA').closest('button');
    fireEvent.click(wrongBtn);
    expect(mockRecordReview).toHaveBeenCalledWith(expect.any(Number), 'forgot', expect.any(Number));
    expect(screen.getByText('0 checkmark')).toBeInTheDocument();
    const nextBtn = screen.getByText('Next');
    fireEvent.click(nextBtn);
    expect(screen.getByText('2 / 20')).toBeInTheDocument();
  });

  it('handles timeout correctly', async () => {
    const reviews = generateMockReviews(25);
    render(<ChallengeMode reviews={reviews} recordReview={mockRecordReview} onClose={mockOnClose} />);
    act(() => {
      vi.advanceTimersByTime(16000);
    });
    expect(screen.getByText(/Time's up!/)).toBeInTheDocument();
    expect(mockRecordReview).toHaveBeenCalledWith(expect.any(Number), 'forgot', 15000);
    const nextBtn = screen.getByText('Next');
    fireEvent.click(nextBtn);
    expect(screen.getByText('2 / 20')).toBeInTheDocument();
  });

  it('shows result screen after all questions and handles retry/close', async () => {
    const reviews = generateMockReviews(1);
    render(<ChallengeMode reviews={reviews} recordReview={mockRecordReview} onClose={mockOnClose} />);
    for (let i = 0; i < 20; i++) {
      const btn = screen.getByText('OptB').closest('button');
      fireEvent.click(btn);
      const nextBtnText = i === 19 ? 'See Results' : 'Next';
      const nextBtn = screen.getByText(nextBtnText);
      fireEvent.click(nextBtn);
    }
    expect(screen.getByText('Challenge Mode Complete')).toBeInTheDocument();
    expect(screen.getByText('20/20')).toBeInTheDocument();
    const retryBtn = screen.getByText('Try Again').closest('button');
    fireEvent.click(retryBtn);
    expect(screen.getByText('1 / 20')).toBeInTheDocument();
    const exitBtn = screen.getByText('Exit').closest('button');
    fireEvent.click(exitBtn);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes properly from result screen', async () => {
    const reviews = generateMockReviews(1);
    render(<ChallengeMode reviews={reviews} recordReview={mockRecordReview} onClose={mockOnClose} />);
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
