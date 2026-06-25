import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RetentionHeatmap from './RetentionHeatmap';

// Mock the tooltip components to ensure they render content inline for testing
vi.mock('@/components/ui/tooltip', () => {
  return {
    TooltipProvider: ({ children }) => <div data-testid="tooltip-provider">{children}</div>,
    Tooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
    // Mock TooltipTrigger to just render its children without asChild prop logic overriding things
    TooltipTrigger: ({ children }) => <div data-testid="tooltip-trigger">{children}</div>,
    TooltipContent: ({ children }) => <div data-testid="tooltip-content">{children}</div>,
  };
});

describe('RetentionHeatmap', () => {
  beforeEach(() => {
    // Set a fixed date for deterministic testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-10-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders gracefully without stats', () => {
    render(<RetentionHeatmap stats={null} />);
    expect(screen.getByText('Study Activity')).toBeInTheDocument();
    expect(screen.getByText('Less')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('renders gracefully with empty stats', () => {
    render(<RetentionHeatmap stats={{ daily_reviews: {}, daily_correct: {} }} />);
    expect(screen.getByText('Study Activity')).toBeInTheDocument();
  });

  it('renders correctly with stats and applies intensity classes', () => {
    const mockStats = {
      daily_reviews: {
        '2023-10-15': 3,   // bg-success/25
        '2023-10-14': 10,  // bg-success/45
        '2023-10-13': 20,  // bg-success/65
        '2023-10-12': 35,  // bg-success/85
        '2023-10-11': 0,   // bg-muted/10
      },
      daily_correct: {
        '2023-10-15': 2,
        '2023-10-14': 8,
        '2023-10-13': 18,
        '2023-10-12': 30,
        '2023-10-11': 0,
      }
    };

    const { container } = render(<RetentionHeatmap stats={mockStats} />);

    // Total number of blocks should be 182
    const tooltipsTriggers = container.querySelectorAll('.w-3.h-3.rounded-\\[2px\\]');
    // Note: The total number of squares includes the legend (which has 5 squares with size 2.5)
    // and the heatmap blocks. We specifically query for the 3x3 blocks.
    expect(tooltipsTriggers.length).toBe(182);

    // Verify intensity classes are applied correctly
    // Note: We can't easily map the exact element without hover, but we can verify these classes exist
    const html = container.innerHTML;
    expect(html).toContain('bg-muted/10');
    expect(html).toContain('bg-success/25');
    expect(html).toContain('bg-success/45');
    expect(html).toContain('bg-success/65');
    expect(html).toContain('bg-success/85');
  });

  it('passes correct data to tooltip content', () => {
    const mockStats = {
      daily_reviews: {
        '2023-10-15': 35,
      },
      daily_correct: {
        '2023-10-15': 30,
      }
    };

    render(<RetentionHeatmap stats={mockStats} />);

    // With the tooltip components mocked, the TooltipContent is rendered directly into the DOM
    // We can just assert that the content exists.

    const tooltipText = screen.getByText('35 reviews · 30 correct');
    expect(tooltipText).toBeInTheDocument();

    // Construct expected date in local time to prevent timezone-related flaky tests
    const expectedDateStr = new Date(2023, 9, 15).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const dateElement = screen.getByText(expectedDateStr);
    expect(dateElement).toBeInTheDocument();
  });
});
