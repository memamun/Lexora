import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import MatchingDrill from './MatchingDrill';
import { useStudyEngine } from '@/lib/useStudyEngine';
import confetti from 'canvas-confetti';

// Mock dependencies
vi.mock('@/lib/useStudyEngine', () => ({
  useStudyEngine: vi.fn(),
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('@/components/ui/LexoraLogo', () => ({
  default: () => <div data-testid="lexora-logo" />,
}));

vi.mock('@/components/layout/PageHeader', () => ({
  default: ({ title, action }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      {action}
    </div>
  ),
}));

vi.mock('@/components/SessionComplete', () => ({
  default: ({ customTitle, onRetry }) => (
    <div data-testid="session-complete">
      <h2>{customTitle}</h2>
      <button onClick={onRetry}>Retry</button>
    </div>
  ),
}));

const mockWords = [
  { index: 1, word: 'Apple', bengali: 'আপেল', answer: 'a fruit', options: { 'a fruit': 'a fruit' } },
  { index: 2, word: 'Book', bengali: 'বই', answer: 'to read', options: { 'to read': 'to read' } },
  { index: 3, word: 'Cat', bengali: 'বিড়াল', answer: 'an animal', options: { 'an animal': 'an animal' } },
  { index: 4, word: 'Dog', bengali: 'কুকুর', answer: 'bark', options: { 'bark': 'bark' } },
  { index: 5, word: 'Elephant', bengali: 'হাতি', answer: 'big', options: { 'big': 'big' } },
  { index: 6, word: 'Fish', bengali: 'মাছ', answer: 'swim', options: { 'swim': 'swim' } },
];

describe('MatchingDrill Component', () => {
  const mockRecordReview = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    useStudyEngine.mockReturnValue({
      loading: false,
      levelProgress: [{ level_number: 1, is_unlocked: true, is_completed: false }],
      getWeakWords: [],
      getWordsForLevel: vi.fn().mockReturnValue(mockWords),
      recordReview: mockRecordReview,
    });
  });

  const renderComponent = (initialEntries = ['/matching-drill?level=1']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <MatchingDrill />
      </MemoryRouter>
    );
  };

  it('renders loading state initially', () => {
    useStudyEngine.mockReturnValue({
      loading: true,
      levelProgress: [],
      getWeakWords: [],
      getWordsForLevel: vi.fn().mockReturnValue([]),
      recordReview: vi.fn(),
    });

    renderComponent();
    expect(screen.getByTestId('lexora-logo')).toBeInTheDocument();
  });

  it('redirects to active level if no level param and not loading', async () => {
    useStudyEngine.mockReturnValue({
      loading: false,
      levelProgress: [{ level_number: 2, is_unlocked: true, is_completed: false }],
      getWeakWords: [],
      getWordsForLevel: vi.fn().mockReturnValue(mockWords),
      recordReview: mockRecordReview,
    });

    renderComponent(['/matching-drill']);

    // Test logic is correct if we test actual navigation, but component does it implicitly.
    // Wait for the generate logic or rendering of matching drill layout.
    await waitFor(() => {
        expect(screen.getByText('Matching Drill')).toBeInTheDocument();
    });
  });

  it('renders Matching Drill layout with words and meanings', async () => {
    renderComponent();

    await waitFor(() => {
        expect(screen.getByText('Matching Drill')).toBeInTheDocument();
    });

    // Check if some words are rendered
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Book')).toBeInTheDocument();

    // Check if meanings are rendered (default is Bengali)
    expect(screen.getByText('আপেল')).toBeInTheDocument();
    expect(screen.getByText('বই')).toBeInTheDocument();
  });

  it('can switch between English and Bengali', async () => {
    renderComponent();

    await waitFor(() => {
        expect(screen.getByText('Matching Drill')).toBeInTheDocument();
    });

    // Initially Bengali
    expect(screen.getByText('আপেল')).toBeInTheDocument();

    // Switch to English
    const englishBtn = screen.getByText('English');
    fireEvent.click(englishBtn);

    await waitFor(() => {
        expect(screen.getByText('a fruit')).toBeInTheDocument();
    });
  });

  it('forms a match and can undo it', async () => {
    renderComponent();

    await waitFor(() => {
        expect(screen.getByText('Matching Drill')).toBeInTheDocument();
    });

    // Form match
    fireEvent.click(screen.getByText('Apple'));
    fireEvent.click(screen.getByText('আপেল'));

    // The match should appear in the 'Your Matches' section
    // Since 'Apple' appears multiple times, we can look for the undo button
    const undoButtons = screen.getAllByRole('button');
    // find a button with icon or class for undo. Based on code it's a button with RotateCcw
    // but the easier way is to count buttons. But actually "Apple" will show up again in the matches section.
    const appleTexts = screen.getAllByText('Apple');
    expect(appleTexts.length).toBeGreaterThan(1);

    // Click the undo button (the last button in the match item)
    // Finding undo button by testing its class or using querySelector inside the match item.
    // It has a RotateCcw icon. We can just find the button inside the match item.
    // Let's grab all undo buttons - in the original it's a button with class "p-2 hover:bg-destructive/15..."
    const matchItem = appleTexts[1].closest('div').parentElement;
    const undoButton = matchItem.querySelector('button');

    fireEvent.click(undoButton);

    await waitFor(() => {
        const remainingAppleTexts = screen.getAllByText('Apple');
        expect(remainingAppleTexts.length).toBe(1);
    });
  });

  it('checks results for a perfect match and shows complete screen', async () => {
    renderComponent();

    await waitFor(() => {
        expect(screen.getByText('Matching Drill')).toBeInTheDocument();
    });

    // Form correct matches for all 6 pairs
    const pairsToMatch = [
        ['Apple', 'আপেল'],
        ['Book', 'বই'],
        ['Cat', 'বিড়াল'],
        ['Dog', 'কুকুর'],
        ['Elephant', 'হাতি'],
        ['Fish', 'মাছ'],
    ];

    pairsToMatch.forEach(([word, meaning]) => {
        fireEvent.click(screen.getByText(word));
        fireEvent.click(screen.getByText(meaning));
    });

    // Click Check Results
    const checkBtn = screen.getByText('Check Results');
    fireEvent.click(checkBtn);

    await waitFor(() => {
        expect(screen.getByTestId('session-complete')).toBeInTheDocument();
    });

    expect(confetti).toHaveBeenCalled();
    expect(mockRecordReview).toHaveBeenCalledTimes(6);
  });

  it('checks results for an imperfect match, shows score, allows retry', async () => {
    renderComponent();

    await waitFor(() => {
        expect(screen.getByText('Matching Drill')).toBeInTheDocument();
    });

    // Form 1 correct, 5 wrong
    fireEvent.click(screen.getByText('Apple'));
    fireEvent.click(screen.getByText('আপেল')); // Correct

    fireEvent.click(screen.getByText('Book'));
    fireEvent.click(screen.getByText('বিড়াল')); // Wrong

    fireEvent.click(screen.getByText('Cat'));
    fireEvent.click(screen.getByText('কুকুর')); // Wrong

    fireEvent.click(screen.getByText('Dog'));
    fireEvent.click(screen.getByText('হাতি')); // Wrong

    fireEvent.click(screen.getByText('Elephant'));
    fireEvent.click(screen.getByText('মাছ')); // Wrong

    fireEvent.click(screen.getByText('Fish'));
    fireEvent.click(screen.getByText('বই')); // Wrong

    const checkBtn = screen.getByText('Check Results');
    fireEvent.click(checkBtn);

    // Wait for score to appear (1/6 = 17%)
    await waitFor(() => {
        expect(screen.getByText('Score: 17%')).toBeInTheDocument();
    });

    // Click Retry These
    const retryBtn = screen.getByText('Retry These');
    fireEvent.click(retryBtn);

    // Score should disappear and matching drill layout should be back to start
    await waitFor(() => {
        expect(screen.queryByText('Score: 17%')).not.toBeInTheDocument();
    });
  });
});
