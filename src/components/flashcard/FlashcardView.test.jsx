import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import FlashcardView from './FlashcardView';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    animate: vi.fn().mockResolvedValue(),
  };
});

const mockWord = {
  word: 'Apple',
  difficulty: 1,
  part: 1,
  bengali: 'আপেল',
  explanation: 'A fruit',
  index: 0
};

describe('FlashcardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders null when word is not provided', () => {
    const { container } = render(<FlashcardView onRate={vi.fn()} index={0} total={10} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders front of the card', () => {
    render(<FlashcardView word={mockWord} onRate={vi.fn()} index={0} total={10} />);
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('1/10')).toBeInTheDocument();
  });

  it('flips the card when clicked', async () => {
    render(<FlashcardView word={mockWord} onRate={vi.fn()} index={0} total={10} />);

    // Front face should show
    expect(screen.getByText('Apple')).toBeInTheDocument();

    // Click to flip
    const card = screen.getByRole('button', { name: /apple/i });
    fireEvent.click(card);

    // After flip, rating buttons should appear
    expect(screen.getByText('Known', { selector: 'button span' })).toBeInTheDocument();
    expect(screen.getByText('Unknown', { selector: 'button span' })).toBeInTheDocument();
  });

  it('calls onRate with "instant" when clicking Known', async () => {
    const onRate = vi.fn();
    render(<FlashcardView word={mockWord} onRate={onRate} index={0} total={10} />);

    const card = screen.getByRole('button', { name: /apple/i });
    fireEvent.click(card);

    const knownButton = screen.getByText('Known', { selector: 'button span' });
    fireEvent.click(knownButton.closest('button'));

    expect(onRate).toHaveBeenCalledWith('instant', expect.any(Number));
  });

  it('calls onRate with "forgot" when clicking Unknown', async () => {
    const onRate = vi.fn();
    render(<FlashcardView word={mockWord} onRate={onRate} index={0} total={10} />);

    const card = screen.getByRole('button', { name: /apple/i });
    fireEvent.click(card);

    const unknownButton = screen.getByText('Unknown', { selector: 'button span' });
    fireEvent.click(unknownButton.closest('button'));

    expect(onRate).toHaveBeenCalledWith('forgot', expect.any(Number));
  });

  it('calls onRate when using keyboard shortcuts', async () => {
    const onRate = vi.fn();
    render(<FlashcardView word={mockWord} onRate={onRate} index={0} total={10} />);

    fireEvent.keyDown(window, { key: '1' });

    await waitFor(() => {
      expect(onRate).toHaveBeenCalledWith('instant', expect.any(Number));
    });

    onRate.mockClear();

    fireEvent.keyDown(window, { key: '2' });

    await waitFor(() => {
      expect(onRate).toHaveBeenCalledWith('forgot', expect.any(Number));
    });
  });
});
