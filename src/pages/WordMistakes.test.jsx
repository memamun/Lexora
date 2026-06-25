import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { vi } from 'vitest';
import WordMistakes from './WordMistakes';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { NavigationProvider } from '@/lib/NavigationContext';

vi.mock('@/lib/useStudyEngine', () => ({
  useStudyEngine: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('WordMistakes Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <NavigationProvider>
          <WordMistakes />
        </NavigationProvider>
      </BrowserRouter>
    );
  };

  it('renders loading state correctly', () => {
    useStudyEngine.mockReturnValue({
      getAllQuizWrongWords: [],
      quizAttempts: [],
      loading: true,
    });

    const { container } = renderComponent();

    // Check if loading logo is present - no text, so look for svg
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.innerHTML).not.toContain('My Mistakes');
  });

  it('renders empty state correctly when no mistakes exist', () => {
    useStudyEngine.mockReturnValue({
      getAllQuizWrongWords: [],
      quizAttempts: [],
      loading: false,
    });

    renderComponent();

    expect(screen.getByText('No Mistakes Yet')).toBeInTheDocument();
    expect(screen.getByText(/Keep up the great work!/i)).toBeInTheDocument();
    expect(screen.getByText('Continue Studying')).toBeInTheDocument();
  });

  it('renders mistakes and stats correctly', () => {
    const mockWrongWords = [
      {
        index: 1,
        wrongCount: 3,
        word: { word: 'apple', meaning: 'a fruit' },
        levels: [1],
      },
      {
        index: 2,
        wrongCount: 2,
        word: { word: 'banana', meaning: 'another fruit' },
        levels: [1, 2],
      },
    ];

    useStudyEngine.mockReturnValue({
      getAllQuizWrongWords: mockWrongWords,
      quizAttempts: [{}, {}, {}], // 3 attempts
      loading: false,
    });

    const { container } = renderComponent();

    // Content validation
    expect(screen.getByText('apple')).toBeInTheDocument();
    expect(screen.getByText('banana')).toBeInTheDocument();
    expect(screen.getByText('a fruit')).toBeInTheDocument();
    expect(screen.getByText('another fruit')).toBeInTheDocument();
    expect(screen.getByText('Levels: 1, 2')).toBeInTheDocument();

    // Stats validation
    expect(screen.getByText('Total Wrong')).toBeInTheDocument();
    expect(screen.getByText('Unique Words')).toBeInTheDocument();
    expect(screen.getByText('Quiz Attempts')).toBeInTheDocument();

    // Find numbers using container query as they don't have text around them
    const spans = Array.from(container.querySelectorAll('span'));
    const textContents = spans.map(s => s.textContent);
    expect(textContents).toContain('5'); // Total wrong: 3 + 2
    expect(textContents).toContain('2'); // Unique words
    expect(textContents).toContain('3'); // Quiz attempts
  });

  it('navigates to cross-level quiz when button is clicked', () => {
    const mockWrongWords = [
      {
        index: 1,
        wrongCount: 3,
        word: { word: 'apple', meaning: 'a fruit' },
        levels: [1],
      }
    ];

    useStudyEngine.mockReturnValue({
      getAllQuizWrongWords: mockWrongWords,
      quizAttempts: [],
      loading: false,
    });

    renderComponent();

    const quizButton = screen.getByText(/Cross-Level Weak Word Quiz/i);
    fireEvent.click(quizButton);

    expect(mockNavigate).toHaveBeenCalledWith('/cross-level-quiz');
  });
});
