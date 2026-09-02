import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RetentionHeatmap from './RetentionHeatmap';

vi.mock('@/components/ui/tooltip', () => {
  return {
    TooltipProvider: ({ children }) => <>{children}</>,
    Tooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
    TooltipTrigger: ({ children }) => <div data-testid="tooltip-trigger">{children}</div>,
    TooltipContent: ({ children }) => <div data-testid="tooltip-content">{children}</div>,
  };
});

describe('RetentionHeatmap', () => {
  beforeEach(() => {
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
        '2023-10-15': 3,
        '2023-10-14': 10,
        '2023-10-13': 20,
        '2023-10-12': 35,
        '2023-10-11': 0,
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

    const tooltipsTriggers = container.querySelectorAll('.w-3.h-3.rounded-\\[2px\\]');
    expect(tooltipsTriggers.length).toBe(182);

    const html = container.innerHTML;
    expect(html).toContain('bg-muted/10');
    expect(html).toContain('bg-success/25');
    expect(html).toContain('bg-success/45');
    expect(html).toContain('bg-success/65');
    expect(html).toContain('bg-success/85');
  });

  it('displays correct tooltip data', () => {
    const mockStats = {
      daily_reviews: {
        '2023-10-15': 42,
      },
      daily_correct: {
        '2023-10-15': 40,
      }
    };

    render(<RetentionHeatmap stats={mockStats} />);

    expect(screen.getByText('Oct 15, 2023')).toBeInTheDocument();
    expect(screen.getByText('42 reviews · 40 correct')).toBeInTheDocument();
  });
});
