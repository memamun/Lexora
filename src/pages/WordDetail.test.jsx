import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter, useParams, useNavigate } from 'react-router-dom';
import WordDetail from './WordDetail';
import * as audioUtils from '@/utils/audio';

// Mock audio
vi.mock('@/utils/audio', () => ({
  speak: vi.fn(),
  cancelSpeech: vi.fn(),
}));

// Mock routing
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn(),
  };
});

// Mock word data
vi.mock('@/lib/wordData', () => {
  const MOCK_WORDS = [
    {
      index: 1,
      word: 'ABSTAIN',
      meaning: 'Refrain',
      explanation: 'Abstain means to avoid or refrain from something.',
      bengali: 'বিরত থাকা',
      pos: 'verb',
      synonyms: ['refrain', 'desist', 'forgo'],
      antonyms: ['indulge', 'participate'],
      example: 'He decided to abstain from voting in the election.',
      difficulty: 'medium'
    }
  ];

  return {
    ALL_WORDS: MOCK_WORDS,
    WORDS_BY_STR_LOWER: {
      'abstain': MOCK_WORDS[0]
    },
    DIFFICULTY_MAP: {
      'medium': { bg: 'bg-muted', color: 'text-muted-foreground', border: 'border-border', label: 'Medium' }
    },
    getConfusionCluster: vi.fn().mockReturnValue([])
  };
});

// Mock study engine
vi.mock('@/lib/useStudyEngine', () => ({
  useStudyEngine: vi.fn().mockReturnValue({
    getWordReview: vi.fn().mockReturnValue({
      mastery_level: 'learning',
      confidence: 'hesitated',
      total_reviews: 5,
      correct_count: 3,
      streak: 2,
      quiz_wrong_count: 1,
      last_review: new Date('2023-01-01').toISOString()
    })
  })
}));

// Mock PageHeader to keep things simple
vi.mock('@/components/layout/PageHeader', () => ({
  default: ({ action }) => <div data-testid="page-header">{action}</div>
}));

describe('WordDetail', () => {
  const navigateMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(navigateMock);

    // Setup localStorage mock
    const store = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(key => store[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      store[key] = value.toString();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders "Word Not Found" when word does not exist', () => {
    useParams.mockReturnValue({ id: '999' });

    render(
      <BrowserRouter>
        <WordDetail />
      </BrowserRouter>
    );

    expect(screen.getByText('Word Not Found')).toBeInTheDocument();

    const goBackButton = screen.getByText('Go Back');
    fireEvent.click(goBackButton);
    expect(navigateMock).toHaveBeenCalledWith(-1);
  });

  it('renders word details correctly', () => {
    useParams.mockReturnValue({ id: '1' });

    render(
      <BrowserRouter>
        <WordDetail />
      </BrowserRouter>
    );

    expect(screen.getByText('ABSTAIN')).toBeInTheDocument();
    expect(screen.getByText('verb')).toBeInTheDocument();
    expect(screen.getByText('বিরত থাকা')).toBeInTheDocument();
    // cleanedExplanation transforms "Abstain means to avoid..." -> "Avoid..."
    expect(screen.getByText(/Avoid or refrain from something./i)).toBeInTheDocument(); // meaning
  });

  it('handles playing audio', () => {
    useParams.mockReturnValue({ id: '1' });

    render(
      <BrowserRouter>
        <WordDetail />
      </BrowserRouter>
    );

    const listenButton = screen.getByText('Listen');
    fireEvent.click(listenButton);
    expect(audioUtils.speak).toHaveBeenCalledWith('ABSTAIN');
  });

  it('handles toggling favorites', () => {
    useParams.mockReturnValue({ id: '1' });

    render(
      <BrowserRouter>
        <WordDetail />
      </BrowserRouter>
    );

    // The favorite button is the first button in the page header actions
    const favoriteButton = screen.getByTestId('page-header').querySelector('button');
    expect(favoriteButton).toBeInTheDocument();

    fireEvent.click(favoriteButton);
    expect(localStorage.setItem).toHaveBeenCalledWith('lexora-favorites', JSON.stringify([1]));
  });

  it('displays study engine statistics', () => {
    useParams.mockReturnValue({ id: '1' });

    render(
      <BrowserRouter>
        <WordDetail />
      </BrowserRouter>
    );

    expect(screen.getByText('learning')).toBeInTheDocument();
    expect(screen.getByText('~ Hesitated')).toBeInTheDocument();

    // In our mock: total 5, correct 3, streak 2, wrong 1
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('handles share functionality using navigator.share when available', async () => {
    useParams.mockReturnValue({ id: '1' });

    // Mock navigator.share
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      configurable: true,
      writable: true
    });

    render(
      <BrowserRouter>
        <WordDetail />
      </BrowserRouter>
    );

    // Share is the second button in the header
    const buttons = screen.getByTestId('page-header').querySelectorAll('button');
    const shareButton = buttons[1];

    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith({
        title: 'ABSTAIN',
        url: window.location.href
      });
    });

    // Clean up
    delete navigator.share;
  });

  it('handles share functionality using fallback when navigator.share is unavailable', async () => {
    useParams.mockReturnValue({ id: '1' });

    // Make sure navigator.share is falsy and mock clipboard
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      configurable: true
    });

    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText
      },
      configurable: true
    });

    render(
      <BrowserRouter>
        <WordDetail />
      </BrowserRouter>
    );

    // Share is the second button in the header
    const buttons = screen.getByTestId('page-header').querySelectorAll('button');
    const shareButton = buttons[1];

    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(window.location.href);
    });
  });
});
