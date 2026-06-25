import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RetentionHeatmap from './RetentionHeatmap';

// Mock the Tooltip components so we don't have to deal with Radix timers and pointer events in JSDOM
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }) => <>{children}</>,
  Tooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children, asChild }) => {
    // If asChild is true, we just return the child and append a way to find it or trigger it.
    // Let's attach onMouseEnter to trigger state change in test.
    return <div data-testid="tooltip-trigger">{children}</div>
  },
  TooltipContent: ({ children }) => <div data-testid="tooltip-content">{children}</div>,
}));

describe('RetentionHeatmap', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-10-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders correctly with no stats', () => {
    render(<RetentionHeatmap stats={null} />);
    expect(screen.getByText('Study Activity')).toBeInTheDocument();
  });

  it('renders correctly with data and applies intensity classes', () => {
    const stats = {
      daily_reviews: {
        '2023-10-15': 2,
        '2023-10-14': 10,
        '2023-10-13': 20,
        '2023-10-12': 40,
        '2023-10-11': 0,
      },
      daily_correct: {
        '2023-10-15': 2,
        '2023-10-14': 8,
        '2023-10-13': 15,
        '2023-10-12': 35,
        '2023-10-11': 0,
      }
    };

    const { container } = render(<RetentionHeatmap stats={stats} />);

    // Check that we have tooltips rendered
    const tooltips = screen.getAllByTestId('tooltip');
    expect(tooltips.length).toBeGreaterThan(0);

    const blocksWith25 = container.querySelectorAll('.bg-success\\/25');
    const blocksWith45 = container.querySelectorAll('.bg-success\\/45');
    const blocksWith65 = container.querySelectorAll('.bg-success\\/65');
    const blocksWith85 = container.querySelectorAll('.bg-success\\/85');

    expect(blocksWith25.length).toBeGreaterThanOrEqual(2);
    expect(blocksWith45.length).toBeGreaterThanOrEqual(2);
    expect(blocksWith65.length).toBeGreaterThanOrEqual(2);
    expect(blocksWith85.length).toBeGreaterThanOrEqual(2);
  });

  it('displays correct tooltip data', () => {
    const stats = {
      daily_reviews: {
        '2023-10-15': 42,
      },
      daily_correct: {
        '2023-10-15': 40,
      }
    };

    render(<RetentionHeatmap stats={stats} />);

    // Because we mocked TooltipContent to just render its children,
    // we can directly assert that the formatted text exists in the document.
    expect(screen.getByText('Oct 15, 2023')).toBeInTheDocument();
    expect(screen.getByText('42 reviews · 40 correct')).toBeInTheDocument();
  });
});
