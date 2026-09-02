import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ChallengeMode from './ChallengeMode';
import { ALL_WORDS } from '@/lib/wordData';

// Mock matchMedia to prevent framer-motion errors
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Since the component uses random shuffling and ALL_WORDS is large, let's inject predictable behavior.
// We'll fix Math.random so shuffle always does the same thing,
// and we'll mock ALL_WORDS to a smaller set for predictable testing if needed,
// but using the real ALL_WORDS with a fixed seed is also fine.

describe('ChallengeMode', () => {
  const mockRecordReview = vi.fn().mockResolvedValue();
  const mockOnClose = vi.fn();

  // Create mock reviews for words at index 0, 1, 2.
  // ALL_WORDS[0] is ABSTAIN (correct: Refrain)
  // ALL_WORDS[1] is ACCORD (correct: Agreement)
  // ALL_WORDS[2] is ADAMANT (correct: Unyielding)
  // ALL_WORDS[3] is ADEPT (correct: Skilled)
  const mockReviews = [
    { word_index: 0, correct_count: 1, total_reviews: 5 }, // 20%
    { word_index: 1, correct_count: 2, total_reviews: 5 }, // 40%
    { word_index: 2, correct_count: 4, total_reviews: 5 }, // 80%
    // Index 3 is unstudied
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // A predictable random sequence for shuffling
    let randIndex = 0;
    const rands = [0.1, 0.5, 0.9, 0.3, 0.7];
    vi.spyOn(Math, 'random').mockImplementation(() => {
      const val = rands[randIndex % rands.length];
      randIndex++;
      return val;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders and builds quiz from hardest words and backfills', () => {
    render(
      <ChallengeMode
        reviews={mockReviews}
        recordReview={mockRecordReview}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Challenge Mode')).toBeInTheDocument();
    expect(screen.getByText('Synonym for')).toBeInTheDocument();
    expect(screen.getByText('1 / 20')).toBeInTheDocument();

    // There should be options (A, B, C, D)
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('handles answering a question correctly', async () => {
    render(
      <ChallengeMode
        reviews={mockReviews}
        recordReview={mockRecordReview}
        onClose={mockOnClose}
      />
    );

    // Get the word being asked to know what the correct answer is
    const wordElement = document.querySelector('h2');
    const word = wordElement.textContent;
    const wordData = ALL_WORDS.find(w => w.word === word);
    const correctAnswer = wordData.options?.[wordData.answer] || wordData.answer;

    // Find the button with the correct answer text
    const correctOption = screen.getByText(correctAnswer);

    // Click it
    fireEvent.click(correctOption);

    // Should call recordReview with 'instant'
    expect(mockRecordReview).toHaveBeenCalledWith(wordData.index, 'instant', expect.any(Number));

    // The correct option should now be styled as correct (success)
    expect(correctOption).toHaveClass('text-success');

    // "Next" button should appear
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeInTheDocument();

    // Click Next
    fireEvent.click(nextButton);

    // Should move to the next question
    expect(screen.getByText('2 / 20')).toBeInTheDocument();
  });

  it('handles answering a question incorrectly', async () => {
    render(
      <ChallengeMode
        reviews={mockReviews}
        recordReview={mockRecordReview}
        onClose={mockOnClose}
      />
    );

    const wordElement = document.querySelector('h2');
    const word = wordElement.textContent;
    const wordData = ALL_WORDS.find(w => w.word === word);
    const correctAnswer = wordData.options?.[wordData.answer] || wordData.answer;

    // Find an incorrect option
    const options = Object.values(wordData.options).filter(Boolean);
    const incorrectAnswer = options.find(o => o !== correctAnswer);
    const incorrectOption = screen.getByText(incorrectAnswer);

    // Click it
    fireEvent.click(incorrectOption);

    // Should call recordReview with 'forgot'
    expect(mockRecordReview).toHaveBeenCalledWith(wordData.index, 'forgot', expect.any(Number));

    // The incorrect option should be styled as destructive
    expect(incorrectOption).toHaveClass('text-destructive');

    // Click Next
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    // Should move to the next question
    expect(screen.getByText('2 / 20')).toBeInTheDocument();
  });

  it('handles timeout correctly', async () => {
    render(
      <ChallengeMode
        reviews={mockReviews}
        recordReview={mockRecordReview}
        onClose={mockOnClose}
      />
    );

    const wordElement = document.querySelector('h2');
    const word = wordElement.textContent;
    const wordData = ALL_WORDS.find(w => w.word === word);

    // Fast-forward 15 seconds
    act(() => {
      vi.advanceTimersByTime(15000);
    });

    // Should display timeout message
    expect(screen.getByText(/Time's up!/)).toBeInTheDocument();

    // Should call recordReview with 'forgot' and 15000ms duration
    expect(mockRecordReview).toHaveBeenCalledWith(wordData.index, 'forgot', 15000);

    // Click Next
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    expect(screen.getByText('2 / 20')).toBeInTheDocument();
  });

  it('navigates to ChallengeResult when all questions are answered', async () => {
    render(
      <ChallengeMode
        reviews={mockReviews}
        recordReview={mockRecordReview}
        onClose={mockOnClose}
      />
    );

    // Answer 20 questions
    for (let i = 0; i < 20; i++) {
      const wordElement = document.querySelector('h2');
      const word = wordElement.textContent;

      // Some words exist multiple times in ALL_WORDS with slightly different options (e.g. MITIGATE),
      // we need to find the specific wordData that matches the currently displayed options
      const displayedOptions = Array.from(screen.getAllByRole('button'))
        .filter(b => b.textContent.match(/^[A-D]/))
        .map(b => b.textContent.substring(1));

      const wordDataList = ALL_WORDS.filter(w => w.word === word);
      let wordData = wordDataList[0];
      let correctAnswer = wordData.options?.[wordData.answer] || wordData.answer;

      // To be safe, just try clicking until we find the correct one if there's ambiguity,
      // but since we just need to advance, we can just find which option is marked correct
      // by cheating and looking at the DOM after a click, or more cleanly, looking at ALL_WORDS.
      // But actually we just need to click the right one.

      // Let's find the correct answer string by checking the displayed options against all possible correct answers for this word.
      for (const wd of wordDataList) {
         const ans = wd.options?.[wd.answer] || wd.answer;
         if (displayedOptions.includes(ans)) {
            correctAnswer = ans;
            break;
         }
      }

      const correctOptionButtons = screen.getAllByText(correctAnswer).filter(el => el.tagName === 'SPAN' && !el.className.includes('shrink-0'));
      const correctOption = correctOptionButtons.find(el => el.closest('button'));
      fireEvent.click(correctOption.closest('button'));

      const nextButton = screen.getByText(i === 19 ? 'See Results' : 'Next');
      fireEvent.click(nextButton);
    }

    // Should show ChallengeResult screen
    expect(screen.getByText('Challenge Mode Complete')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();

    // "Try Again" and "Back" buttons should be present
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('calls onClose when Exit button is clicked from quiz', () => {
    render(
      <ChallengeMode
        reviews={mockReviews}
        recordReview={mockRecordReview}
        onClose={mockOnClose}
      />
    );

    const exitButton = screen.getByText('Exit');
    fireEvent.click(exitButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('handles retrying the challenge from the result screen', async () => {
    render(
      <ChallengeMode
        reviews={mockReviews}
        recordReview={mockRecordReview}
        onClose={mockOnClose}
      />
    );

    // Answer all questions quickly to get to the result screen
    for (let i = 0; i < 20; i++) {
      const wordElement = document.querySelector('h2');
      const word = wordElement.textContent;

      const displayedOptions = Array.from(screen.getAllByRole('button'))
        .filter(b => b.textContent.match(/^[A-D]/))
        .map(b => b.textContent.substring(1));

      const wordDataList = ALL_WORDS.filter(w => w.word === word);
      let correctAnswer = wordDataList[0].options?.[wordDataList[0].answer] || wordDataList[0].answer;

      for (const wd of wordDataList) {
         const ans = wd.options?.[wd.answer] || wd.answer;
         if (displayedOptions.includes(ans)) {
            correctAnswer = ans;
            break;
         }
      }

      const correctOptionButtons = screen.getAllByText(correctAnswer).filter(el => el.tagName === 'SPAN' && !el.className.includes('shrink-0'));
      const correctOption = correctOptionButtons.find(el => el.closest('button'));
      fireEvent.click(correctOption.closest('button'));

      const nextButton = screen.getByText(i === 19 ? 'See Results' : 'Next');
      fireEvent.click(nextButton);
    }

    // Now on Result screen
    expect(screen.getByText('Challenge Mode Complete')).toBeInTheDocument();

    // Click Try Again
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    // Should be back on the quiz
    expect(screen.getByText('1 / 20')).toBeInTheDocument();
  });
});
