import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MasteryRing from '../MasteryRing';

// Mock WORD_COUNT from wordData
vi.mock('@/lib/wordData', () => ({
  WORD_COUNT: 1000,
}));

describe('MasteryRing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with valid masteryStats', () => {
    const mockStats = {
      mastered: 200,
      reviewing: 150,
      learning: 50,
      new: 600,
    };

    render(<MasteryRing masteryStats={mockStats} />);

    // Total percentage should be ((200 + 150) / 1000) * 100 = 35%
    expect(screen.getByText('35%')).toBeInTheDocument();

    // Check if the Progress label is rendered
    expect(screen.getByText('Progress')).toBeInTheDocument();

    // Check if all legend counts are rendered correctly
    // The MasteryRing renders standard labels plus the count in a <b> tag
    // Because the structure is {seg.label} <b>{count}</b>, getByText won't easily grab "Mastered 200"
    // So we can check for the bold elements by their values
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('600')).toBeInTheDocument();
  });

  it('renders correctly when masteryStats has 0 values', () => {
    const mockStats = {
      mastered: 0,
      reviewing: 0,
      learning: 0,
      new: 1000,
    };

    render(<MasteryRing masteryStats={mockStats} />);

    // Total percentage should be 0%
    expect(screen.getByText('0%')).toBeInTheDocument();

    // There will be multiple '0' elements (for mastered, reviewing, learning) and one '1000'
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
    expect(screen.getByText('1000')).toBeInTheDocument();
  });

  it('handles missing values in masteryStats safely', () => {
    // Only providing some stats
    const mockStats = {
      mastered: 200,
    };

    render(<MasteryRing masteryStats={mockStats} />);

    // Total percentage should be ((200 + 0) / 1000) * 100 = 20%
    expect(screen.getByText('20%')).toBeInTheDocument();

    expect(screen.getByText('200')).toBeInTheDocument();

    // Missing stats should default to 0
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBe(3); // reviewing, learning, new
  });

  it('handles completely empty masteryStats gracefully', () => {
    render(<MasteryRing masteryStats={{}} />);

    // Total percentage should be 0%
    expect(screen.getByText('0%')).toBeInTheDocument();

    // Missing stats should default to 0 for all 4 categories
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(4);
  });
});
