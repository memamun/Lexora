import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import ChallengeMode from './ChallengeMode';

vi.mock('@/lib/wordData', () => ({
  ALL_WORDS: Array.from({ length: 30 }).map((_, i) => ({
    index: i,
    word: `WORD_${i}`,
    options: { A: `Correct_${i}`, B: `WrongB_${i}`, C: `WrongC_${i}`, D: `WrongD_${i}` },
    answer: "A",
    explanation: `Explanation_${i}`
  }))
}));

// Mock timer ring as it uses SVG and strokeDasharray which might cause issues
vi.mock('./TimerRing', () => ({
  default: () => <div data-testid="timer-ring">Timer</div>
}));

describe('ChallengeMode', () => {
  const mockRecordReview = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Use a fixed value for Math.random so shuffle doesn't change ordering randomly in test
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const getReviews = () => {
    // Provide 20 reviews to ensure the component doesn't need to fetch unstudied words
    return Array.from({ length: 20 }).map((_, i) => ({
      word_index: i,
      total_reviews: 2,
      correct_count: 1 // 50% acc
    }));
  };

  it('renders correctly and displays the first question', () => {
    render(<ChallengeMode reviews={getReviews()} recordReview={mockRecordReview} onClose={mockOnClose} />);

    // Check for "Challenge Mode" title
    expect(screen.getByText('Challenge Mode')).toBeInTheDocument();

    // Look for a word
    const wordHeading = screen.getByRole('heading', { level: 2 });
    expect(wordHeading).toBeInTheDocument();
    expect(wordHeading.textContent).toMatch(/WORD_\d+/);

    // Look for exit button
    expect(screen.getByText(/Exit/i)).toBeInTheDocument();
  });

  it('handles answering a question correctly', () => {
    render(<ChallengeMode reviews={getReviews()} recordReview={mockRecordReview} onClose={mockOnClose} />);

    const wordHeading = screen.getByRole('heading', { level: 2 });
    const wordText = wordHeading.textContent;
    const index = parseInt(wordText.split('_')[1]);

    // Click the correct answer
    const correctBtn = screen.getByText(`Correct_${index}`);
    fireEvent.click(correctBtn);

    // Expect recordReview to have been called with 'instant'
    expect(mockRecordReview).toHaveBeenCalledWith(index, 'instant', expect.any(Number));

    // Explanation should appear
    expect(screen.getByText(`Explanation_${index}`)).toBeInTheDocument();

    // Click next
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);

    // Next question should appear
    expect(screen.getByRole('heading', { level: 2 }).textContent).not.toBe(wordText);
  });

  it('handles answering a question incorrectly', () => {
    render(<ChallengeMode reviews={getReviews()} recordReview={mockRecordReview} onClose={mockOnClose} />);

    const wordHeading = screen.getByRole('heading', { level: 2 });
    const wordText = wordHeading.textContent;
    const index = parseInt(wordText.split('_')[1]);

    // Click the wrong answer
    const wrongBtn = screen.getByText(`WrongB_${index}`);
    fireEvent.click(wrongBtn);

    // Expect recordReview to have been called with 'forgot'
    expect(mockRecordReview).toHaveBeenCalledWith(index, 'forgot', expect.any(Number));
  });

  it('handles timeout when timer runs out', () => {
    render(<ChallengeMode reviews={getReviews()} recordReview={mockRecordReview} onClose={mockOnClose} />);

    const wordHeading = screen.getByRole('heading', { level: 2 });
    const wordText = wordHeading.textContent;
    const index = parseInt(wordText.split('_')[1]);

    // Fast forward 15 seconds
    act(() => {
      vi.advanceTimersByTime(15000);
    });

    // Expect timeout message
    expect(screen.getByText(/Time's up!/i)).toBeInTheDocument();

    // Expect recordReview to have been called with 'forgot'
    expect(mockRecordReview).toHaveBeenCalledWith(index, 'forgot', 15000);
  });

  it('completes the challenge and shows results screen', () => {
    render(<ChallengeMode reviews={getReviews()} recordReview={mockRecordReview} onClose={mockOnClose} />);

    for (let i = 0; i < 20; i++) {
      const wordHeading = screen.getByRole('heading', { level: 2 });
      const wordText = wordHeading.textContent;
      const index = parseInt(wordText.split('_')[1]);

      // Click the correct answer
      const correctBtn = screen.getByText(`Correct_${index}`);
      fireEvent.click(correctBtn);

      if (i < 19) {
        // Click next
        const nextBtn = screen.getByRole('button', { name: /Next/i });
        fireEvent.click(nextBtn);
      } else {
        // Click See Results
        const resultsBtn = screen.getByRole('button', { name: /See Results/i });
        fireEvent.click(resultsBtn);
      }
    }

    // Results screen should appear
    expect(screen.getByText('Challenge Mode Complete')).toBeInTheDocument();
    expect(screen.getByText('20/20')).toBeInTheDocument(); // Score
  });

  it('allows retrying the challenge from results screen', () => {
    render(<ChallengeMode reviews={getReviews()} recordReview={mockRecordReview} onClose={mockOnClose} />);

    // Advance to end
    for (let i = 0; i < 20; i++) {
      const wordHeading = screen.getByRole('heading', { level: 2 });
      const index = parseInt(wordHeading.textContent.split('_')[1]);
      fireEvent.click(screen.getByText(`Correct_${index}`));
      fireEvent.click(screen.getByRole('button', { name: i < 19 ? /Next/i : /See Results/i }));
    }

    // Click Try Again
    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));

    // Should be back to quiz
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

    // Advance to end
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
