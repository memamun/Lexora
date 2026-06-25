import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import WordDetail from '../WordDetail';
import * as audioUtils from '@/utils/audio';

// Mock dependencies
vi.mock('@/lib/wordData', () => ({
  ALL_WORDS: [
    {
      index: 1,
      word: 'ABSTAIN',
      explanation: 'Abstain means to avoid or refrain from something.',
      bengali: 'বিরত থাকা',
      synonyms: ['refrain', 'desist'],
      antonyms: ['indulge'],
      example: 'He decided to abstain from voting in the election.',
      pos: 'verb'
    }
  ],
  WORDS_BY_STR_LOWER: {
    'refrain': { index: 2 },
    'desist': { index: 3 },
    'indulge': { index: 4 }
  },
  DIFFICULTY_MAP: {},
  getConfusionCluster: vi.fn(() => ['ABSTAIN', 'REFRAIN'])
}));

vi.mock('@/lib/useStudyEngine', () => ({
  useStudyEngine: vi.fn(() => ({
    getWordReview: vi.fn(() => ({
      mastery_level: 'learning',
      confidence: 'hesitated',
      total_reviews: 5,
      correct_count: 3,
      streak: 2,
      quiz_wrong_count: 1,
      last_review: '2023-10-01T12:00:00Z'
    }))
  }))
}));

vi.mock('@/utils/audio', () => ({
  speak: vi.fn(),
  cancelSpeech: vi.fn()
}));

// Mock PageHeader to simplify testing and provide actions mapping
// WordDetail uses `action` prop not `actions`
vi.mock('@/components/layout/PageHeader', () => ({
  default: ({ title, subtitle, action }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      <h2>{subtitle}</h2>
      <div data-testid="header-actions">{action}</div>
    </div>
  )
}));

describe('WordDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderComponent = (id = 1) => {
    return render(
      <MemoryRouter initialEntries={[`/word/${id}`]}>
        <Routes>
          <Route path="/word/:id" element={<WordDetail />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders word details correctly', () => {
    renderComponent();

    // Check if word and parts of speech are rendered
    expect(screen.getByText('ABSTAIN')).toBeInTheDocument();
    expect(screen.getByText('verb')).toBeInTheDocument();

    // Check if bengali meaning is rendered
    expect(screen.getByText('বিরত থাকা')).toBeInTheDocument();

    // Check if example is rendered
    expect(screen.getByText(/He decided to/)).toBeInTheDocument();
    expect(screen.getByText('abstain')).toBeInTheDocument();
    expect(screen.getByText(/from voting in the election./)).toBeInTheDocument();
  });

  it('handles favorite toggling via localStorage', () => {
    renderComponent();

    const headerActions = screen.getByTestId('header-actions');
    const buttons = headerActions.querySelectorAll('button');
    const favBtn = buttons[0]; // The favorite button is the first button inside the action prop div

    // Initial state: not favorite
    expect(localStorage.getItem('lexora-favorites')).toBeNull();

    // Click to favorite
    fireEvent.click(favBtn);
    expect(localStorage.getItem('lexora-favorites')).toEqual(JSON.stringify([1]));

    // Click to unfavorite
    fireEvent.click(favBtn);
    expect(localStorage.getItem('lexora-favorites')).toEqual(JSON.stringify([]));
  });

  it('calls speak function when audio button is clicked', () => {
    renderComponent();

    const listenButton = screen.getByText('Listen');
    fireEvent.click(listenButton.closest('button'));

    expect(audioUtils.speak).toHaveBeenCalledWith('ABSTAIN');
  });

  it('renders word status correctly from useStudyEngine', () => {
    renderComponent();

    expect(screen.getByText('learning')).toBeInTheDocument();
    expect(screen.getByText('~ Hesitated')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // total_reviews
    expect(screen.getByText('3')).toBeInTheDocument(); // correct_count
    expect(screen.getByText('2')).toBeInTheDocument(); // streak
  });
});
