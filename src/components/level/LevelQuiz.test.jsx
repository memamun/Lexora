import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LevelQuiz from './LevelQuiz';
import * as utils from '@/lib/utils';

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

// Mock utils.shuffle to be deterministic (returns array as is)
vi.spyOn(utils, 'shuffle').mockImplementation((arr) => [...arr]);

const mockWords = [
  { index: 0, word: "WORD_ONE", options: { A: "Meaning 1", B: "Wrong 1B", C: "Wrong 1C", D: "Wrong 1D" }, answer: "A", explanation: "Explanation 1" },
  { index: 1, word: "WORD_TWO", options: { A: "Wrong 2A", B: "Meaning 2", C: "Wrong 2C", D: "Wrong 2D" }, answer: "B", explanation: "Explanation 2" },
  { index: 2, word: "WORD_THREE", options: { A: "Wrong 3A", B: "Wrong 3B", C: "Meaning 3", D: "Wrong 3D" }, answer: "C", explanation: "Explanation 3" },
  { index: 3, word: "WORD_FOUR", options: { A: "Wrong 4A", B: "Wrong 4B", C: "Wrong 4C", D: "Meaning 4" }, answer: "D", explanation: "Explanation 4" },
  { index: 4, word: "WORD_FIVE", options: { A: "Meaning 5", B: "Wrong 5B", C: "Wrong 5C", D: "Wrong 5D" }, answer: "A", explanation: "Explanation 5" },
];

describe('LevelQuiz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderQuiz = (props = {}) => {
    return render(
      <MemoryRouter>
        <LevelQuiz words={mockWords} levelNumber={1} onComplete={vi.fn()} {...props} />
      </MemoryRouter>
    );
  };

  it('renders initial state correctly', () => {
    renderQuiz();

    // First word should be WORD_ONE because shuffle is mocked
    expect(screen.getByText('WORD_ONE')).toBeInTheDocument();

    // Progress should be 1/5
    expect(screen.getByText('1/5')).toBeInTheDocument();

    // Correct count should be 0
    expect(screen.getByText('0 ✓')).toBeInTheDocument();
  });

  it('handles interaction and progression', async () => {
    renderQuiz();

    // The correct answer for WORD_ONE is "Meaning 1", which will be at label 'A' because we mocked shuffle
    const optA = screen.getByText('Meaning 1');
    fireEvent.click(optA.closest('button'));

    // Should show explanation and Next button
    expect(screen.getByText('Explanation 1')).toBeInTheDocument();
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    expect(nextBtn).toBeInTheDocument();

    // Correct count should update to 1 ✓
    expect(screen.getByText('1 ✓')).toBeInTheDocument();

    // Click Next
    fireEvent.click(nextBtn);

    // Should move to next question (WORD_TWO)
    expect(screen.getByText('WORD_TWO')).toBeInTheDocument();
    expect(screen.getByText('2/5')).toBeInTheDocument();
  });

  it('completes the quiz and shows passing result', async () => {
    const onCompleteMock = vi.fn();
    renderQuiz({ onComplete: onCompleteMock });

    for (let i = 0; i < 5; i++) {
      const currentWord = mockWords[i];
      const correctText = currentWord.options[currentWord.answer];
      const optBtn = screen.getByText(correctText).closest('button');

      fireEvent.click(optBtn);

      // Click Next/Finish
      const nextBtn = screen.getByRole('button', { name: /Next|Finish/i });
      fireEvent.click(nextBtn);
    }

    // Should show passing result
    expect(screen.getByText('Level Mastered!')).toBeInTheDocument();
    expect(screen.getAllByText('100%')[0]).toBeInTheDocument();

    // Click continue
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
    const onCompleteMock = vi.fn();
    renderQuiz({ onComplete: onCompleteMock });

    // Answer all incorrectly (B is wrong for WORD_ONE, WORD_THREE, WORD_FOUR, WORD_FIVE.
    // For WORD_TWO, B is correct. So let's pick an explicitly incorrect string based on what's rendered)

    for (let i = 0; i < 5; i++) {
      const currentWord = mockWords[i];
      const correctText = currentWord.options[currentWord.answer];

      // Find a button that does NOT contain the correctText
      const allButtons = screen.getAllByRole('button');
      // The options are the first 4 buttons
      const incorrectBtn = allButtons.find(btn => !btn.textContent.includes(correctText) && btn.textContent.match(/^[A-D]/));

      fireEvent.click(incorrectBtn);

      // Click Next/Finish
      const nextBtn = screen.getByRole('button', { name: /Next|Finish/i });
      fireEvent.click(nextBtn);
    }

    // Should show failing result
    expect(screen.getByText('Keep Practicing')).toBeInTheDocument();
    expect(screen.getAllByText('0%')[0]).toBeInTheDocument();

    // Check callback for failing
    const backBtn = screen.getByRole('button', { name: /Back to Level Dashboard/i });
    fireEvent.click(backBtn);

    expect(onCompleteMock).toHaveBeenCalledWith({
      score: 0,
      wrongWordIndices: [0, 1, 2, 3, 4],
      totalQuestions: 5,
      correctCount: 0
    });

    // Test retry
    const retryBtn = screen.getByRole('button', { name: /Try Quiz Again/i });
    fireEvent.click(retryBtn);

    // Should be back to first question
    expect(screen.getByText('WORD_ONE')).toBeInTheDocument();
    expect(screen.getByText('1/5')).toBeInTheDocument();
    expect(screen.getByText('0 ✓')).toBeInTheDocument();
  });
});
