import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import LevelQuiz from './LevelQuiz';

// Mock dependencies
import confettiMock from 'canvas-confetti';
vi.mock('canvas-confetti', () => {
  return {
    default: vi.fn(),
  };
});

vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    // Return original array to ensure predictable question order and choices order
    shuffle: vi.fn((arr) => [...arr]),
  };
});

// Mock wordData entirely or just DIFFICULTY_MAP
vi.mock('@/lib/wordData', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    DIFFICULTY_MAP: {
      easy: { label: 'Easy', bg: 'bg-green-100', color: 'text-green-800', border: 'border-green-200' }
    }
  };
});

// Avoid "window.matchMedia is not a function" error if used internally by framer-motion or radices
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});


describe('LevelQuiz Component', () => {
  const mockWords = [
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

  const onCompleteMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Use fake timers but configure it specifically or avoid it for Framer Motion.
    // Actually, framer motion sometimes loops if timers are mocked entirely.
    // Let's just mock what we need or turn off fake timers.
    // Framer motion uses requestAnimationFrame, let's mock it if needed or just use real timers.
    // Since Framer Motion uses sync layout, we might not need fake timers for simple components.
    // Let's try real timers.
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <MemoryRouter>
        <LevelQuiz
          words={mockWords}
          levelNumber={1}
          onComplete={onCompleteMock}
          {...props}
        />
      </MemoryRouter>
    );
  };

  it('renders the first question correctly', () => {
    renderComponent();

    // With shuffle mocked, the first question should be ABSTAIN
    expect(screen.getByText('ABSTAIN')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument(); // Question progress

    // In our mock words, there are only 2 words.
    // So the distractors for ABSTAIN will only be ACCORD's correct answer ("Agreement").
    // The options shown will be "Refrain" and "Agreement" and likely "undefined" since we only have 2 words in mock and generateQuestions expects up to 3 distractors.
    // Let's check for 'Refrain' and 'Agreement'
    expect(screen.getByText('Refrain')).toBeInTheDocument();
    expect(screen.getByText('Agreement')).toBeInTheDocument();
  });

  it('handles answering correctly and proceeding to next question', async () => {
    renderComponent();

    const refrainButton = screen.getByText('Refrain').closest('button');
    fireEvent.click(refrainButton);

    // After clicking, explanation should be visible
    expect(screen.getByText('Abstain means to avoid or refrain from something.')).toBeInTheDocument();

    // And a "Next" button should appear
    const nextButton = screen.getByRole('button', { name: /Next/i });
    expect(nextButton).toBeInTheDocument();

    // Click Next
    fireEvent.click(nextButton);

    // Wait for the next question to appear
    expect(await screen.findByText('ACCORD', {}, {timeout: 3000})).toBeInTheDocument();
    expect(screen.getByText('2/2')).toBeInTheDocument();
  });

  it('handles answering incorrectly', () => {
    renderComponent();

    // Find an incorrect option, e.g., 'Agreement' (which is the distractor from word 2)
    const agreementButton = screen.getByText('Agreement').closest('button');
    fireEvent.click(agreementButton);

    // After clicking, explanation should still be visible
    expect(screen.getByText('Abstain means to avoid or refrain from something.')).toBeInTheDocument();

    // The option should reflect it's wrong (maybe check the icon or class, but we can just check if Next exists)
    const nextButton = screen.getByRole('button', { name: /Next/i });
    expect(nextButton).toBeInTheDocument();
  });

  it('completes the quiz and shows results', async () => {
    renderComponent();

    // Answer Q1 (ABSTAIN) -> Refrain
    fireEvent.click(screen.getByText('Refrain').closest('button'));
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Wait for Q2 (ACCORD)
    expect(await screen.findByText('ACCORD', {}, {timeout: 3000})).toBeInTheDocument();

    // Answer Q2 (ACCORD) -> Agreement
    fireEvent.click(screen.getByText('Agreement').closest('button'));

    // Last button should be "Finish"
    const finishButton = await screen.findByRole('button', { name: /Finish/i });
    expect(finishButton).toBeInTheDocument();

    // Complete quiz
    fireEvent.click(finishButton);

    // Results screen should show
    expect(await screen.findByText('Level Mastered!', {}, {timeout: 3000})).toBeInTheDocument();
    expect(screen.getByText('Mastery Quiz Review')).toBeInTheDocument();

    // Check stats (2/2 correct -> 100%)
    expect(screen.getAllByText('100%').length).toBeGreaterThan(0);

    // Since we passed (100% > 80%), check confetti
    expect(confettiMock).toHaveBeenCalled();

    // Check "Next Level" button triggers onComplete
    const nextLevelButton = screen.getByRole('button', { name: /Continue to Next Level/i });
    fireEvent.click(nextLevelButton);
    expect(onCompleteMock).toHaveBeenCalled();
  });

  it('allows retrying when score is low', async () => {
    renderComponent();

    // Answer Q1 Incorrectly (Agreement)
    fireEvent.click(screen.getByText('Agreement').closest('button'));
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Wait for Q2
    expect(await screen.findByText('ACCORD', {}, {timeout: 3000})).toBeInTheDocument();

    // Answer Q2 Incorrectly (Refrain)
    fireEvent.click(screen.getByText('Refrain').closest('button'));

    const finishButton = await screen.findByRole('button', { name: /Finish/i });
    fireEvent.click(finishButton);

    // Results screen should show failed state
    expect(await screen.findByText('Keep Practicing', {}, {timeout: 3000})).toBeInTheDocument();
    expect(screen.getAllByText('0%').length).toBeGreaterThan(0);

    // Click retry
    const retryButton = screen.getByRole('button', { name: /Try Quiz Again/i });
    fireEvent.click(retryButton);

    // Should be back to Q1
    expect(await screen.findByText('ABSTAIN', {}, {timeout: 3000})).toBeInTheDocument();
    expect(screen.queryByText('Keep Practicing')).not.toBeInTheDocument();
  });
});
