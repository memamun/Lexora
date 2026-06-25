import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import StatsRow from './StatsRow';

// Mock the word data
vi.mock('@/lib/wordData', () => ({
  WORD_COUNT: 1000
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      // Remove framer-motion specific props
      const { initial, animate, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    }
  }
}));

// Provide a wrapper for Router since component uses Link
const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('StatsRow Component', () => {
  beforeEach(() => {
    // Freeze time for consistent "Today" calculations
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders correctly with empty/null props', () => {
    renderWithRouter(<StatsRow stats={null} masteryStats={null} />);

    // Day Streak should default to 0
    expect(screen.getByText('Day Streak')).toBeInTheDocument();
    expect(screen.getAllByText('0')[0]).toBeInTheDocument();

    // Mastered should default to 0/1000
    expect(screen.getByText('Mastered')).toBeInTheDocument();
    expect(screen.getByText('0/1000')).toBeInTheDocument();

    // Accuracy should default to 0%
    expect(screen.getByText('Accuracy')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();

    // Today should default to 0
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('displays the correct day streak', () => {
    const stats = { current_streak_days: 42 };
    renderWithRouter(<StatsRow stats={stats} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('displays the correct mastered words fraction', () => {
    const masteryStats = { mastered: 150 };
    renderWithRouter(<StatsRow masteryStats={masteryStats} />);
    expect(screen.getByText('150/1000')).toBeInTheDocument();
  });

  it('calculates and displays accuracy correctly', () => {
    const stats = { total_reviews: 100, total_correct: 85 };
    renderWithRouter(<StatsRow stats={stats} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('handles accuracy calculation correctly with 0 reviews', () => {
    const stats = { total_reviews: 0, total_correct: 0 };
    renderWithRouter(<StatsRow stats={stats} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('handles accuracy calculation with rounding correctly', () => {
    // 2/3 is 66.666...% -> should round to 67%
    const stats = { total_reviews: 3, total_correct: 2 };
    renderWithRouter(<StatsRow stats={stats} />);
    expect(screen.getByText('67%')).toBeInTheDocument();
  });

  it('displays todays reviews correctly based on the current date', () => {
    const todayStr = '2024-03-15'; // from the mocked date
    const stats = {
      daily_reviews: {
        [todayStr]: 15,
        '2024-03-14': 20
      }
    };
    renderWithRouter(<StatsRow stats={stats} />);
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('renders a valid link for the Mastered card', () => {
    renderWithRouter(<StatsRow stats={{}} masteryStats={{}} />);

    // Check if the link exists
    const links = screen.getAllByRole('link');
    // Only the 'Mastered' card has a valid link (to '/words'), others point to '#'
    const wordsLink = links.find(link => link.getAttribute('href') === '/words');
    expect(wordsLink).toBeInTheDocument();
    expect(wordsLink).toHaveTextContent('Mastered');
  });
});
