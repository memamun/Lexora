import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FlashcardView from './FlashcardView';
import { describe, it, expect, afterEach, vi } from 'vitest';
import React from 'react';

// Mock framer-motion to prevent animation-related issues in jsdom
vi.mock('framer-motion', async () => {
  const React = await import('react');
  return {
    motion: {
      div: React.forwardRef(function MotionDiv({ children, className, onClick, onKeyDown, role, tabIndex, 'data-testid': testId, style }, ref) {
        return (
      <div
        className={className}
        onClick={onClick}
        onKeyDown={onKeyDown}
        role={role}
        tabIndex={tabIndex}
        data-testid={testId}
        style={style}
        ref={ref}
      >
        {children}
        </div>
      );
    }),
    },
    AnimatePresence: ({ children }) => <>{children}</>,
    useMotionValue: () => ({ set: vi.fn(), get: () => 0 }),
    useTransform: () => ({}),
    animate: vi.fn().mockResolvedValue(),
  };
});

const mockWord = {
  index: 1,
  word: 'ABSTAIN',
  part: 'A',
  difficulty: 1,
  bengali: 'বিরত থাকা',
  explanation: 'Abstain means to avoid or refrain from something.'
};

describe('FlashcardView Component', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing if word is not provided', () => {
    const { container } = render(<FlashcardView word={null} onRate={vi.fn()} index={0} total={10} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders front and back faces with correct word information', () => {
    render(<FlashcardView word={mockWord} onRate={vi.fn()} index={0} total={10} />);

    // Check if the front face shows the English word
    expect(screen.getByText('ABSTAIN')).toBeInTheDocument();

    // Check if the back face shows the Bengali meaning and explanation
    expect(screen.getByText('বিরত থাকা')).toBeInTheDocument();
    expect(screen.getByText('Abstain means to avoid or refrain from something.')).toBeInTheDocument();
  });

  it('flips the flashcard when clicked to reveal rating buttons', async () => {
    render(<FlashcardView word={mockWord} onRate={vi.fn()} index={0} total={10} />);

    // Initially, rating buttons should not be visible (because they are conditionally rendered on flipped state)
    expect(screen.queryByText('Known', { selector: 'button span' })).not.toBeInTheDocument();
    expect(screen.queryByText('Unknown', { selector: 'button span' })).not.toBeInTheDocument();

    // Click the flashcard container
    const cardContainer = screen.getByText('ABSTAIN');
    await userEvent.click(cardContainer);

    // After click, buttons should appear
    expect(screen.getByText('Known', { selector: 'button span' })).toBeInTheDocument();
    expect(screen.getByText('Unknown', { selector: 'button span' })).toBeInTheDocument();
  });

  it('flips the flashcard when Space or Enter is pressed', async () => {
    render(<FlashcardView word={mockWord} onRate={vi.fn()} index={0} total={10} />);

    // Press Space
    await userEvent.keyboard(' ');
    expect(screen.getByText('Known', { selector: 'button span' })).toBeInTheDocument();

    // Press Enter to flip back
    await userEvent.keyboard('{Enter}');
    expect(screen.queryByText('Known', { selector: 'button span' })).not.toBeInTheDocument();
  });

  it('calls onRate with "instant" when "Known" button is clicked', async () => {
    const onRateMock = vi.fn();
    render(<FlashcardView word={mockWord} onRate={onRateMock} index={0} total={10} />);

    // Flip first
    await userEvent.keyboard(' ');

    const knownButton = screen.getByText('Known', { selector: 'button span' });
    await userEvent.click(knownButton);

    expect(onRateMock).toHaveBeenCalledWith('instant', expect.any(Number));
  });

  it('calls onRate with "forgot" when "Unknown" button is clicked', async () => {
    const onRateMock = vi.fn();
    render(<FlashcardView word={mockWord} onRate={onRateMock} index={0} total={10} />);

    // Flip first
    await userEvent.keyboard(' ');

    const unknownButton = screen.getByText('Unknown', { selector: 'button span' });
    await userEvent.click(unknownButton);

    expect(onRateMock).toHaveBeenCalledWith('forgot', expect.any(Number));
  });

  it('calls onRate via keyboard shortcuts (1, 2, Arrow keys)', async () => {
    const onRateMock = vi.fn();
    render(<FlashcardView word={mockWord} onRate={onRateMock} index={0} total={10} />);

    // '1' is Known (instant)
    await userEvent.keyboard('1');
    expect(onRateMock).toHaveBeenCalledWith('instant', expect.any(Number));
    onRateMock.mockClear();

    // '2' is Unknown (forgot)
    await userEvent.keyboard('2');
    expect(onRateMock).toHaveBeenCalledWith('forgot', expect.any(Number));
    onRateMock.mockClear();

    // ArrowRight is Known (instant)
    await userEvent.keyboard('{ArrowRight}');
    expect(onRateMock).toHaveBeenCalledWith('instant', expect.any(Number));
    onRateMock.mockClear();

    // ArrowLeft is Unknown (forgot)
    await userEvent.keyboard('{ArrowLeft}');
    expect(onRateMock).toHaveBeenCalledWith('forgot', expect.any(Number));
    onRateMock.mockClear();
  });

  it('ignores keyboard shortcuts if active element is input or textarea', async () => {
    const onRateMock = vi.fn();
    render(
      <div>
        <input type="text" data-testid="test-input" />
        <textarea data-testid="test-textarea" />
        <FlashcardView word={mockWord} onRate={onRateMock} index={0} total={10} />
      </div>
    );

    const input = screen.getByTestId('test-input');
    input.focus();

    // Press Space, it should not flip
    await userEvent.keyboard(' ');
    expect(screen.queryByText('Known', { selector: 'button span' })).not.toBeInTheDocument();

    // Press '1', it should not call onRate
    await userEvent.keyboard('1');
    expect(onRateMock).not.toHaveBeenCalled();

    const textarea = screen.getByTestId('test-textarea');
    textarea.focus();

    await userEvent.keyboard('2');
    expect(onRateMock).not.toHaveBeenCalled();
  });
});
