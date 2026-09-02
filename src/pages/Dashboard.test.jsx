import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/lib/useStudyEngine', () => ({
  useStudyEngine: vi.fn()
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, 'data-testid': testId }) => <div className={className} data-testid={testId}>{children}</div>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}));

vi.mock('firebase/app', () => ({
  getApp: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
}));

// Mock child components to simplify testing
vi.mock('@/components/dashboard/StatsRow', () => ({ default: () => <div data-testid="StatsRow" /> }));
vi.mock('@/components/dashboard/MasteryRing', () => ({ default: () => <div data-testid="MasteryRing" /> }));
vi.mock('@/components/dashboard/WordQueue', () => ({ default: () => <div data-testid="WordQueue" /> }));
vi.mock('@/components/dashboard/RetentionHeatmap', () => ({ default: () => <div data-testid="RetentionHeatmap" /> }));
vi.mock('@/components/dashboard/LevelTracker', () => ({ default: () => <div data-testid="LevelTracker" /> }));
vi.mock('@/components/layout/PageHeader', () => ({ default: ({ title }) => <div data-testid="PageHeader">{title}</div> }));

import { useStudyEngine } from '@/lib/useStudyEngine';
import { useAuth } from '@/lib/AuthContext';
import { getDocs } from 'firebase/firestore';

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useStudyEngine.mockReturnValue({
      stats: {},
      levelProgress: [{ level_number: 1, is_unlocked: true, is_completed: false, words_studied: 10 }],
      loading: false,
      getDueWords: vi.fn(),
      getWeakWords: vi.fn(),
      getNearForgettingWords: vi.fn(),
      getMasteryStats: vi.fn(),
    });

    useAuth.mockReturnValue({
      user: { name: 'TestUser Lastname' }
    });

    getDocs.mockResolvedValue({
      docs: [
        { id: '1', data: () => ({ displayName: 'Alice', current_streak_days: 5, photoURL: '' }) },
        { id: '2', data: () => ({ displayName: 'Bob', current_streak_days: 3, photoURL: '' }) },
      ]
    });
  });

  it('renders skeleton when loading', () => {
    useStudyEngine.mockReturnValue({ loading: true });
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders dashboard with mocked data and child components', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Wait for the leaders loading to finish
    await waitFor(() => {
      expect(screen.getByTestId('PageHeader')).toHaveTextContent(/Welcome back, TestUser/i);
    });

    expect(screen.getByTestId('StatsRow')).toBeInTheDocument();
    expect(screen.getByTestId('MasteryRing')).toBeInTheDocument();
    expect(screen.getByTestId('WordQueue')).toBeInTheDocument();
    expect(screen.getByTestId('RetentionHeatmap')).toBeInTheDocument();
    expect(screen.getByTestId('LevelTracker')).toBeInTheDocument();

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('5d')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('3d')).toBeInTheDocument();

    expect(screen.getByText(/Level 1 Mastery/i)).toBeInTheDocument();
    expect(screen.getByText(/50%/i)).toBeInTheDocument();
  });

  it('handles error when fetching leaders', async () => {
    getDocs.mockRejectedValue(new Error('Firebase error'));

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('PageHeader')).toHaveTextContent(/Welcome back, TestUser/i);
    });

    expect(screen.getByText(/No streaks recorded yet/i)).toBeInTheDocument();
  });
});
