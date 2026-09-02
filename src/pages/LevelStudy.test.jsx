import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LevelStudy from './LevelStudy';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as studyEngineModule from '@/lib/useStudyEngine';
import * as audioModule from '@/utils/audio';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ levelNumber: '1' }),
  };
});

// Mock PageHeader to avoid NavigationProvider error and LexoraLogo error
vi.mock('@/components/layout/PageHeader', () => ({
  default: ({ title, subtitle, action, onBack, backTo }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {onBack && <button onClick={onBack}>Back</button>}
      {backTo && <span>Back to {backTo}</span>}
      {action && <div>{action}</div>}
    </div>
  )
}));

vi.mock('@/components/ui/LexoraLogo', () => ({
  default: () => <div className="animate-pulse" data-testid="lexora-logo" />
}));

// Mock study engine
vi.mock('@/lib/useStudyEngine', () => ({
  useStudyEngine: vi.fn(),
}));

// Mock audio
vi.mock('@/utils/audio', () => ({
  speak: vi.fn(),
}));

// Mock framer-motion
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    motion: {
      div: ({ children, className, onClick, ...props }) => <div className={className} onClick={onClick} data-testid={props['data-testid']}>{children}</div>,
      circle: ({ className, ...props }) => <circle className={className} />,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
  };
});

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock child components to keep tests focused on LevelStudy logic
vi.mock('@/components/flashcard/FlashcardView', () => ({
  default: ({ onRate }) => (
    <div data-testid="flashcard-view">
      <button onClick={() => onRate('forgot', 1000)}>Rate Forgot</button>
      <button onClick={() => onRate('got_it', 1000)}>Rate Got It</button>
    </div>
  )
}));

vi.mock('@/components/SessionComplete', () => ({
  default: ({ onReturn, onRetry }) => (
    <div data-testid="session-complete">
      <button onClick={onReturn}>Return</button>
      <button onClick={onRetry}>Retry</button>
    </div>
  )
}));

vi.mock('@/components/level/LevelQuiz', () => ({
  default: ({ onComplete }) => (
    <div data-testid="level-quiz">
      <button onClick={() => onComplete({ score: 100, wrongWordIndices: [] })}>Complete Quiz</button>
    </div>
  )
}));

describe('LevelStudy Page', () => {
  const mockStudyEngine = {
    getWordsForLevel: vi.fn(),
    recordReview: vi.fn(),
    recordLevelQuiz: vi.fn(),
    levelProgress: [],
    loading: false,
    isLevelUnlocked: vi.fn(),
    getQuizWrongWordsForLevel: vi.fn(),
  };

  const mockWords = [
    { index: 1, word: 'apple', pos: 'noun', bengali: 'আপেল', meaning: 'a fruit', explanation: 'A red fruit', example: 'I ate an apple', synonyms: [], antonyms: [] },
    { index: 2, word: 'banana', pos: 'noun', bengali: 'কলা', meaning: 'a yellow fruit', explanation: 'A yellow fruit', example: 'I ate a banana', synonyms: [], antonyms: [] },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    studyEngineModule.useStudyEngine.mockReturnValue(mockStudyEngine);
    mockStudyEngine.isLevelUnlocked.mockReturnValue(true);
    mockStudyEngine.getWordsForLevel.mockReturnValue(mockWords);
    mockStudyEngine.getQuizWrongWordsForLevel.mockReturnValue([]);
    mockStudyEngine.levelProgress = [{ level_number: 1, words_studied: 1, quiz_score: 50 }];
    mockStudyEngine.loading = false;
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/study-level/1']}>
        <Routes>
          <Route path="/study-level/:levelNumber" element={<LevelStudy />} />
          <Route path="/levels" element={<div data-testid="levels-page">Levels Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('shows loading state when loading is true', () => {
    mockStudyEngine.loading = true;
    renderComponent();
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument(); // LexoraLogo loading indicator or similar class
  });

  it('redirects to /levels if level is invalid', async () => {
    mockStudyEngine.isLevelUnlocked.mockReturnValue(false);
    renderComponent();
    expect(mockNavigate).toHaveBeenCalledWith('/levels', { replace: true });
  });

  it('renders menu view with level words curriculum', () => {
    renderComponent();
    expect(screen.getByText(/Level 1/i)).toBeInTheDocument();
    expect(screen.getByText('apple')).toBeInTheDocument();
    expect(screen.getByText('banana')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Flashcards/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Spelling/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Matching/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Mastery Quiz/i })).toBeInTheDocument();
  });

  it('shows mistakes vault if there are wrong words', () => {
    mockStudyEngine.getQuizWrongWordsForLevel.mockReturnValue([mockWords[0]]);
    renderComponent();
    expect(screen.getByRole('heading', { name: /Mistakes Vault/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Review Mistakes/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Mistake Quiz/i })).toBeInTheDocument();
  });

  it('navigates to spelling practice when clicking spelling', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('heading', { name: /Spelling/i }).closest('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/spelling?level=1');
  });

  it('navigates to matching drill when clicking matching', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('heading', { name: /Matching/i }).closest('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/matching?level=1');
  });

  it('switches to flashcard view when clicking flashcards', () => {
    renderComponent();
    const flashcardsBtn = screen.getByText('Flashcards').closest('button');
    fireEvent.click(flashcardsBtn);
    expect(screen.getByTestId('flashcard-view')).toBeInTheDocument();
  });

  it('switches to mastery quiz view when clicking mastery quiz', () => {
    renderComponent();
    const quizBtn = screen.getByText('Mastery Quiz').closest('button');
    fireEvent.click(quizBtn);
    expect(screen.getByTestId('level-quiz')).toBeInTheDocument();
  });

  it('switches to wrong-review when clicking review mistakes', () => {
    mockStudyEngine.getQuizWrongWordsForLevel.mockReturnValue([mockWords[0]]);
    renderComponent();
    const reviewBtn = screen.getByText('Review Mistakes').closest('button');
    fireEvent.click(reviewBtn);
    expect(screen.getByTestId('flashcard-view')).toBeInTheDocument();
  });

  it('switches to wrong-quiz when clicking mistake quiz', () => {
    mockStudyEngine.getQuizWrongWordsForLevel.mockReturnValue([mockWords[0]]);
    renderComponent();
    const quizBtn = screen.getByText('Mistake Quiz').closest('button');
    fireEvent.click(quizBtn);
    expect(screen.getByTestId('level-quiz')).toBeInTheDocument();
  });

  it('handles quiz completion and navigates to next level if score >= 80', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Mastery Quiz').closest('button'));
    fireEvent.click(screen.getByText('Complete Quiz'));

    await waitFor(() => {
      expect(mockStudyEngine.recordLevelQuiz).toHaveBeenCalledWith(1, 100, []);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/study-level/2');
  });

  it('expands word details and can play audio', () => {
    renderComponent();
    // Expand the word "apple"
    const wordCard = screen.getByText('apple').closest('.cursor-pointer');
    fireEvent.click(wordCard);

    // Check if expanded content is visible
    expect(screen.getByText('A red fruit')).toBeInTheDocument();

    // Play audio
    const audioBtn = wordCard.querySelector('button');
    fireEvent.click(audioBtn);
    expect(audioModule.speak).toHaveBeenCalledWith('apple');
  });

  it('can exit session back to menu', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Flashcards').closest('button'));
    expect(screen.getByTestId('flashcard-view')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Exit Session'));
    expect(screen.queryByTestId('flashcard-view')).not.toBeInTheDocument();
    expect(screen.getByText('Flashcards')).toBeInTheDocument();
  });

  it('handles flashcard rate got_it and completes session', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Flashcards').closest('button'));

    // Rate got_it for apple
    fireEvent.click(screen.getByText('Rate Got It'));
    expect(mockStudyEngine.recordReview).toHaveBeenCalledWith(1, 'got_it', 1000);

    // Rate got_it for banana
    fireEvent.click(screen.getByText('Rate Got It'));
    expect(mockStudyEngine.recordReview).toHaveBeenCalledWith(2, 'got_it', 1000);

    // Should be complete
    expect(screen.getByTestId('session-complete')).toBeInTheDocument();
  });

  it('handles session complete return to menu', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Flashcards').closest('button'));
    fireEvent.click(screen.getByText('Rate Got It'));
    fireEvent.click(screen.getByText('Rate Got It'));

    fireEvent.click(screen.getByText('Return'));
    expect(screen.getByText('Flashcards')).toBeInTheDocument();
  });
});
