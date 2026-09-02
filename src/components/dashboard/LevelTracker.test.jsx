import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import LevelTracker from './LevelTracker';

const mockLevelProgress = [
  { level_number: 1, is_completed: true, is_unlocked: true, words_studied: 20 },
  { level_number: 2, is_completed: false, is_unlocked: true, words_studied: 10 },
  { level_number: 3, is_completed: false, is_unlocked: false, words_studied: 0 },
];

const renderComponent = (props) => {
  return render(
    <BrowserRouter>
      <LevelTracker {...props} />
    </BrowserRouter>
  );
};

describe('LevelTracker', () => {
  it('renders nothing when levelProgress is empty', () => {
    const { container } = renderComponent({ levelProgress: [] });
    expect(container.firstChild).toBeNull();
  });

  it('renders basic UI text', () => {
    renderComponent({ levelProgress: mockLevelProgress });
    expect(screen.getByText('Study Progress')).toBeInTheDocument();
  });

  it('correctly parses and renders the first active unlocked level', () => {
    renderComponent({ levelProgress: mockLevelProgress });
    expect(screen.getByText('Current: Level 2')).toBeInTheDocument();
    expect(screen.getByText('10/20 words studied')).toBeInTheDocument();
  });

  it('calculates completed levels count correctly', () => {
    renderComponent({ levelProgress: mockLevelProgress });
    expect(screen.getByText(/1 of 15 Levels/i)).toBeInTheDocument();
  });

  it('calculates total mastery percentage correctly based on words_studied', () => {
    renderComponent({ levelProgress: mockLevelProgress });
    // Total words studied = 20 + 10 = 30. (30 / 300) * 100 = 10%
    expect(screen.getByText(/10% Total/i)).toBeInTheDocument();
  });

  it('defaults to level 1 if no level is unlocked and uncompleted', () => {
    const allCompleted = [
      { level_number: 1, is_completed: true, is_unlocked: true, words_studied: 20 },
      { level_number: 2, is_completed: true, is_unlocked: true, words_studied: 20 },
    ];
    renderComponent({ levelProgress: allCompleted });
    expect(screen.getByText('Current: Level 1')).toBeInTheDocument();
  });
});
