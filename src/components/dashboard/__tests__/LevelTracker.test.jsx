import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import LevelTracker from '../LevelTracker';

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('LevelTracker', () => {
  it('renders null when levelProgress is empty', () => {
    const { container } = renderWithRouter(<LevelTracker levelProgress={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders Path Mastery header with correct completed count and total mastery', () => {
    const levelProgress = [
      { level_number: 1, is_unlocked: true, is_completed: true, words_studied: 20 },
      { level_number: 2, is_unlocked: true, is_completed: true, words_studied: 20 },
      { level_number: 3, is_unlocked: true, is_completed: false, words_studied: 10 },
      { level_number: 4, is_unlocked: false, is_completed: false, words_studied: 0 },
    ];

    // total studied = 20 + 20 + 10 + 0 = 50.
    // Total mastery = Math.round((50 / 300) * 100) = Math.round(16.66) = 17%
    // completed = 2

    renderWithRouter(<LevelTracker levelProgress={levelProgress} />);

    expect(screen.getByText('Path Mastery')).toBeInTheDocument();
    expect(screen.getByText('2 of 15 Levels · 17% Total')).toBeInTheDocument();
  });

  it('renders the correct current level details', () => {
    const levelProgress = [
      { level_number: 1, is_unlocked: true, is_completed: true, words_studied: 20 },
      { level_number: 2, is_unlocked: true, is_completed: false, words_studied: 5 },
    ];

    renderWithRouter(<LevelTracker levelProgress={levelProgress} />);

    expect(screen.getByText('Current: Level 2')).toBeInTheDocument();
    expect(screen.getByText('5/20 words studied')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('falls back to the first level if no level is unlocked and uncompleted', () => {
    const levelProgress = [
      { level_number: 1, is_unlocked: true, is_completed: true, words_studied: 20 },
      { level_number: 2, is_unlocked: true, is_completed: true, words_studied: 20 },
    ];

    renderWithRouter(<LevelTracker levelProgress={levelProgress} />);

    expect(screen.getByText('Current: Level 1')).toBeInTheDocument();
    expect(screen.getByText('20/20 words studied')).toBeInTheDocument();
  });

  it('renders the progress bar correctly based on level statuses', () => {
    const levelProgress = [
      { level_number: 1, is_unlocked: true, is_completed: true, words_studied: 20 },
      { level_number: 2, is_unlocked: true, is_completed: false, words_studied: 5 },
      { level_number: 3, is_unlocked: false, is_completed: false, words_studied: 0 },
    ];

    const { container } = renderWithRouter(<LevelTracker levelProgress={levelProgress} />);

    const segments = container.querySelectorAll('.flex-1.rounded-full');
    expect(segments).toHaveLength(15);

    // Level 1: completed
    expect(segments[0]).toHaveClass('bg-success');

    // Level 2: current
    expect(segments[1]).toHaveClass('bg-primary', 'animate-pulse');

    // Level 3: locked
    expect(segments[2]).toHaveClass('bg-muted');

    // Level 4-15: missing (locked)
    expect(segments[3]).toHaveClass('bg-muted');
  });

  it('renders an unlocked but not current level differently', () => {
    const levelProgress = [
      { level_number: 1, is_unlocked: true, is_completed: false, words_studied: 10 },
      { level_number: 2, is_unlocked: true, is_completed: false, words_studied: 0 },
    ];

    const { container } = renderWithRouter(<LevelTracker levelProgress={levelProgress} />);
    const segments = container.querySelectorAll('.flex-1.rounded-full');

    // Level 1: current
    expect(segments[0]).toHaveClass('bg-primary', 'animate-pulse');

    // Level 2: unlocked but not current
    expect(segments[1]).toHaveClass('bg-primary/20');
  });

  it('handles words_studied as undefined gracefully', () => {
    const levelProgress = [
      { level_number: 1, is_unlocked: true, is_completed: false },
    ];

    renderWithRouter(<LevelTracker levelProgress={levelProgress} />);

    expect(screen.getByText('0/20 words studied')).toBeInTheDocument();
    expect(screen.getByText('0 of 15 Levels · 0% Total')).toBeInTheDocument();
  });
});
