import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import WordMistakes from './WordMistakes';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { NavigationProvider } from '@/lib/NavigationContext';

// Mock the dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock('@/lib/useStudyEngine', () => ({
  useStudyEngine: vi.fn(),
}));

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }) => <div {...props}>{children}</div>,
      svg: ({ children, ...props }) => <svg {...props}>{children}</svg>,
      polygon: ({ children, ...props }) => <polygon {...props}>{children}</polygon>,
      g: ({ children, ...props }) => <g {...props}>{children}</g>,
    },
  };
});

describe('WordMistakes', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <NavigationProvider>
          <WordMistakes />
        </NavigationProvider>
      </MemoryRouter>
    );
  };

  it('renders loading state correctly', () => {
    useStudyEngine.mockReturnValue({
      getAllQuizWrongWords: [],
      quizAttempts: [],
      loading: true,
    });

    const { container } = renderComponent();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders empty state when there are no mistakes', () => {
    useStudyEngine.mockReturnValue({
      getAllQuizWrongWords: [],
      quizAttempts: [1, 2], // mocked attempts
      loading: false,
    });

    renderComponent();

    expect(screen.getByText('No Mistakes Yet')).toBeInTheDocument();
    expect(screen.getByText('Keep up the great work! Your quiz answers are spot on so far.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /continue studying/i })).toHaveAttribute('href', '/levels');
  });

  it('renders stats and list when there are mistakes', () => {
    useStudyEngine.mockReturnValue({
      getAllQuizWrongWords: [
        {
          index: 10,
          wrongCount: 3,
          word: { word: 'aberrant', meaning: 'deviating from what is normal' },
          levels: [1],
        },
        {
          index: 15,
          wrongCount: 1,
          word: { word: 'cacophony', meaning: 'a harsh discordant mixture of sounds' },
          levels: [2],
        },
      ],
      quizAttempts: [1, 2, 3], // Mocked attempts
      loading: false,
    });

    renderComponent();

    // Check stats
    expect(screen.getByText('Total Wrong')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument(); // 3 + 1

    expect(screen.getByText('Unique Words')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    expect(screen.getByText('Quiz Attempts')).toBeInTheDocument();
    const threeElements = screen.getAllByText('3');
    expect(threeElements.length).toBeGreaterThan(0);

    // Check words
    expect(screen.getByText('aberrant')).toBeInTheDocument();
    expect(screen.getByText('deviating from what is normal')).toBeInTheDocument();

    expect(screen.getByText('cacophony')).toBeInTheDocument();
    expect(screen.getByText('a harsh discordant mixture of sounds')).toBeInTheDocument();
  });

  it('navigates to cross-level quiz on button click', () => {
    useStudyEngine.mockReturnValue({
      getAllQuizWrongWords: [
        {
          index: 10,
          wrongCount: 3,
          word: { word: 'aberrant', meaning: 'deviating from what is normal' },
          levels: [1],
        },
      ],
      quizAttempts: [1, 2, 3],
      loading: false,
    });

    renderComponent();

    const quizButton = screen.getByRole('button', { name: /cross-level weak word quiz/i });
    fireEvent.click(quizButton);

    expect(mockNavigate).toHaveBeenCalledWith('/cross-level-quiz');
  });
});