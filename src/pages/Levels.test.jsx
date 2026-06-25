import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Levels from './Levels';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { useNavigate } from 'react-router-dom';

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

vi.mock('@/lib/useStudyEngine', () => ({
  useStudyEngine: vi.fn(),
}));

vi.mock('@/lib/NavigationContext', () => ({
  useNavigation: vi.fn(() => ({ openMobile: vi.fn() })),
}));

// We only want to mock framer-motion minimally to allow rendering but avoiding real animations that complicate testing
vi.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(({ children, ...props }, ref) => {
        const { initial, animate, transition, whileHover, ...rest } = props;
        return <div ref={ref} {...rest}>{children}</div>;
      }),
      circle: React.forwardRef(({ children, ...props }, ref) => {
        const { initial, animate, transition, whileHover, ...rest } = props;
        return <circle ref={ref} {...rest}>{children}</circle>;
      }),
      svg: React.forwardRef(({ children, ...props }, ref) => {
        const { initial, animate, transition, whileHover, ...rest } = props;
        return <svg ref={ref} {...rest}>{children}</svg>;
      }),
      polygon: React.forwardRef(({ children, ...props }, ref) => {
        const { initial, animate, transition, whileHover, ...rest } = props;
        return <polygon ref={ref} {...rest}>{children}</polygon>;
      }),
      g: React.forwardRef(({ children, ...props }, ref) => {
        const { initial, animate, transition, whileHover, ...rest } = props;
        return <g ref={ref} {...rest}>{children}</g>;
      }),
    },
  };
});

describe('Levels Page', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  it('renders loading state when loading is true', () => {
    useStudyEngine.mockReturnValue({
      loading: true,
      levelProgress: [],
      isLevelUnlocked: vi.fn(),
      getWordsForLevel: vi.fn(),
    });

    render(<Levels />);

    // Check that "Synaptic Roadmap" is not present
    expect(screen.queryByText('Synaptic Roadmap')).not.toBeInTheDocument();
  });

  it('renders correctly and computes stats when loading is false', () => {
    useStudyEngine.mockReturnValue({
      loading: false,
      levelProgress: [
        { level_number: 1, words_studied: 20, is_completed: true, quiz_score: 100 },
        { level_number: 2, words_studied: 10, is_completed: false, quiz_score: 0 },
      ],
      isLevelUnlocked: (levelNumber) => levelNumber <= 2,
      getWordsForLevel: vi.fn(),
    });

    render(<Levels />);

    expect(screen.getByText('Synaptic Roadmap')).toBeInTheDocument();

    // Total words = 30
    expect(screen.getByText('30')).toBeInTheDocument();

    // Active paths = 2
    expect(screen.getByText('/ 2 active')).toBeInTheDocument();

    // Completed paths = 1
    // Instead of querying just '1' which may have multiple matches (level 1 badge, etc.),
    // let's narrow it down to the span that comes before '/ 2 active'.
    // Or we can find the metric card and check text content.
    const activePathsText = screen.getByText('/ 2 active');
    const statsContainer = activePathsText.closest('div');
    expect(within(statsContainer).getByText('1')).toBeInTheDocument();

    // Avg score = 100% (since only one is completed)
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('navigates to level study when an unlocked level is clicked', () => {
    useStudyEngine.mockReturnValue({
      loading: false,
      levelProgress: [
        { level_number: 1, words_studied: 20, is_completed: true, quiz_score: 100 },
      ],
      isLevelUnlocked: (levelNumber) => levelNumber === 1,
      getWordsForLevel: vi.fn(),
    });

    render(<Levels />);

    // Level 1 should be unlocked and clickable
    const level1Text = screen.getByText('Level 1');
    const level1Card = level1Text.closest('div[class*="border rounded-2xl"]');

    fireEvent.click(level1Card);

    expect(mockNavigate).toHaveBeenCalledWith('/study-level/1');

    // Level 2 should be locked
    const level2Text = screen.getByText('Level 2');
    const level2Card = level2Text.closest('div[class*="border rounded-2xl"]');
    fireEvent.click(level2Card);

    // Should still only have been called once
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });
});
