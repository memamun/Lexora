import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LevelQuiz from './LevelQuiz';

// Mock confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock framer-motion to avoid AnimatePresence exit animation issues in jsdom
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: {
      div: React.forwardRef(({ children, initial, animate, exit, transition, whileHover, whileTap, variants, ...rest }, ref) => <div ref={ref} {...rest}>{children}</div>),
      h2: React.forwardRef(({ children, initial, animate, exit, transition, whileHover, whileTap, variants, ...rest }, ref) => <h2 ref={ref} {...rest}>{children}</h2>),
      p: React.forwardRef(({ children, initial, animate, exit, transition, whileHover, whileTap, variants, ...rest }, ref) => <p ref={ref} {...rest}>{children}</p>)
    }
  };
});

vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    shuffle: vi.fn((arr) => [...arr]),
  };
});

vi.mock('@/lib/wordData', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    DIFFICULTY_MAP: {
      easy: { label: 'Easy', bg: 'bg-green-100', color: 'text-green-800', border: 'border-green-200' }
    }
  };
});

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

const mockWords = [
  { index: 0, word: "WORD_ONE", options: { A: "Meaning 1", B: "Wrong 1B", C: "Wrong 1C", D: "Wrong 1D" }, answer: "A", explanation: "Explanation 1" },
  { index: 1, word: "WORD_TWO", options: { A: "Wrong 2A", B: "Meaning 2", C: "Wrong 2C", D: "Wrong 2D" }, answer: "B", explanation: "Explanation 2" },
  { index: 2, word: "WORD_THREE", options: { A: "Wrong 3A", B: "Wrong 3B", C: "Meaning 3", D: "Wrong 3D" }, answer: "C", explanation: "Explanation 3" },
  { index: 3, word: "WORD_FOUR", options: { A: "Wrong 4A", B: "Wrong 4B", C: "Wrong 4C", D: "Meaning 4" }, answer: "D", explanation: "Explanation 4" },
  { index: 4, word: "WORD_FIVE", options: { A: "Meaning 5", B: "Wrong 5B", C: "Wrong 5C", D: "Wrong 5D" }, answer: "A", explanation: "Explanation 5" },
];

const mockWordsSimple = [
  {
    index: 0,
    word: 'ABSTAIN',
    options: { A: 'Participate', B: 'Refrain', C: 'Continue', D: 'Demand' },
    answer: 'B',
    explanation: 'Abstain means to avoid or refrain from something.',
    difficulty: 'easy'
  },
  {
    index: 1,
    word: 'ACCORD',
    options: { A: 'Disagreement', B: 'Agreement', C: 'Refusal', D: 'Conflict' },
    answer: 'B',
    explanation: 'Accord means agreement or harmony.',
    difficulty: 'easy'
  }
];

describe('LevelQuiz Component', () => {
  const onCompleteMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderQuiz = (props = {}) => {
    return render(
      <MemoryRouter>
        <LevelQuiz words={mockWords} levelNumber={1} onComplete={onCompleteMock} {...props} />
      </MemoryRouter>
    );
  };

  const renderComponent = (props = {}) => {
    return render(
      <MemoryRouter>
        <LevelQuiz words={mockWordsSimple} levelNumber={1} onComplete={onCompleteMock} {...props} />
      </MemoryRouter>
    );
  };

  it('renders initial state correctly', () => {
    renderQuiz();
    expect(screen.getByText('WORD_ONE')).toBeInTheDocument();
    expect(screen.getByText('1/5')).toBeInTheDocument();
    expect(screen.getByText('0 ✓')).toBeInTheDocument();
  });

  it('handles interaction and progression', async () => {
    renderQuiz();
    const optA = screen.getByText('Meaning 1');
    fireEvent.click(optA.closest('button'));
    expect(screen.getByText('Explanation 1')).toBeInTheDocument();
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    expect(nextBtn).toBeInTheDocument();
    expect(screen.getByText('1 ✓')).toBeInTheDocument();
    fireEvent.click(nextBtn);
    expect(screen.getByText('WORD_TWO')).toBeInTheDocument();
    expect(screen.getByText('2/5')).toBeInTheDocument();
  });

  it('completes the quiz and shows passing result', async () => {
    renderQuiz();
    for (let i = 0; i < 5; i++) {
      const currentWord = mockWords[i];
      const correctText = currentWord.options[currentWord.answer];
      const optBtn = screen.getByText(correctText).closest('button');
      fireEvent.click(optBtn);
      const nextBtn = screen.getByRole('button', { name: /Next|Finish/i });
      fireEvent.click(nextBtn);
    }
    expect(screen.getByText('Level Mastered!')).toBeInTheDocument();
    expect(screen.getAllByText('100%')[0]).toBeInTheDocument();
    const continueBtn = screen.getByRole('button', { name: /Continue to Next Level/i });
    fireEvent.click(continueBtn);
    expect(onCompleteMock).toHaveBeenCalledWith({
      score: 100,
      wrongWordIndices: [],
      totalQuestions: 5,
      correctCount: 5
    });
  });

  it('completes the quiz and shows failing result, allows retry', async () => {
    renderQuiz();
    for (let i = 0; i < 5; i++) {
      const currentWord = mockWords[i];
      const correctText = currentWord.options[currentWord.answer];
      const allButtons = screen.getAllByRole('button');
      const incorrectBtn = allButtons.find(btn => !btn.textContent.includes(correctText) && btn.textContent.match(/^[A-D]/));
      fireEvent.click(incorrectBtn);
      const nextBtn = screen.getByRole('button', { name: /Next|Finish/i });
      fireEvent.click(nextBtn);
    }
    expect(screen.getByText('Keep Practicing')).toBeInTheDocument();
    expect(screen.getAllByText('0%')[0]).toBeInTheDocument();
    const backBtn = screen.getByRole('button', { name: /Back to Level Dashboard/i });
    fireEvent.click(backBtn);
    expect(onCompleteMock).toHaveBeenCalledWith({
      score: 0,
      wrongWordIndices: [0, 1, 2, 3, 4],
      totalQuestions: 5,
      correctCount: 0
    });
    const retryBtn = screen.getByRole('button', { name: /Try Quiz Again/i });
    fireEvent.click(retryBtn);
    expect(screen.getByText('WORD_ONE')).toBeInTheDocument();
    expect(screen.getByText('1/5')).toBeInTheDocument();
    expect(screen.getByText('0 ✓')).toBeInTheDocument();
  });

  it('renders the first question correctly with simple words', () => {
    renderComponent();
    expect(screen.getByText('ABSTAIN')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(screen.getByText('Refrain')).toBeInTheDocument();
    expect(screen.getByText('Agreement')).toBeInTheDocument();
  });

  it('handles answering correctly and proceeding to next question with simple words', async () => {
    renderComponent();
    const refrainButton = screen.getByText('Refrain').closest('button');
    fireEvent.click(refrainButton);
    expect(screen.getByText('Abstain means to avoid or refrain from something.')).toBeInTheDocument();
    const nextButton = screen.getByRole('button', { name: /Next/i });
    expect(nextButton).toBeInTheDocument();
    fireEvent.click(nextButton);
    expect(await screen.findByText('ACCORD', {}, {timeout: 3000})).toBeInTheDocument();
    expect(screen.getByText('2/2')).toBeInTheDocument();
  });

  it('handles answering incorrectly with simple words', () => {
    renderComponent();
    const agreementButton = screen.getByText('Agreement').closest('button');
    fireEvent.click(agreementButton);
    expect(screen.getByText('Abstain means to avoid or refrain from something.')).toBeInTheDocument();
    const nextButton = screen.getByRole('button', { name: /Next/i });
    expect(nextButton).toBeInTheDocument();
  });

  it('completes the quiz and shows results with simple words', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Refrain').closest('button'));
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(await screen.findByText('ACCORD', {}, {timeout: 3000})).toBeInTheDocument();
    fireEvent.click(screen.getByText('Agreement').closest('button'));
    const finishButton = await screen.findByRole('button', { name: /Finish/i });
    expect(finishButton).toBeInTheDocument();
    fireEvent.click(finishButton);
    expect(await screen.findByText('Level Mastered!', {}, {timeout: 3000})).toBeInTheDocument();
    expect(screen.getByText('Mastery Quiz Review')).toBeInTheDocument();
    expect(screen.getAllByText('100%').length).toBeGreaterThan(0);
    const nextLevelButton = screen.getByRole('button', { name: /Continue to Next Level/i });
    fireEvent.click(nextLevelButton);
    expect(onCompleteMock).toHaveBeenCalled();
  });

  it('allows retrying when score is low with simple words', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Agreement').closest('button'));
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(await screen.findByText('ACCORD', {}, {timeout: 3000})).toBeInTheDocument();
    fireEvent.click(screen.getByText('Refrain').closest('button'));
    const finishButton = await screen.findByRole('button', { name: /Finish/i });
    fireEvent.click(finishButton);
    expect(await screen.findByText('Keep Practicing', {}, {timeout: 3000})).toBeInTheDocument();
    expect(screen.getAllByText('0%').length).toBeGreaterThan(0);
    const retryButton = screen.getByRole('button', { name: /Try Quiz Again/i });
    fireEvent.click(retryButton);
    expect(await screen.findByText('ABSTAIN', {}, {timeout: 3000})).toBeInTheDocument();
    expect(screen.queryByText('Keep Practicing')).not.toBeInTheDocument();
  });
});
