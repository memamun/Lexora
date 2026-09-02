import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import SessionComplete from './SessionComplete';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }) => <div className={className}>{children}</div>,
  },
}));

const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(ui, { wrapper: BrowserRouter });
};

describe('SessionComplete', () => {
  it('renders default message with score, total, and accuracy', () => {
    renderWithRouter(
      <SessionComplete score={8} total={10} accuracy={80} />
    );

    expect(screen.getByText('Session Complete!')).toBeInTheDocument();
    expect(screen.getByText(/You scored/)).toBeInTheDocument();
    expect(screen.getByText('8 / 10')).toBeInTheDocument();
    expect(screen.getByText(/with/)).toBeInTheDocument();
    expect(screen.getByText('80% accuracy')).toBeInTheDocument();
  });

  it('renders correctly without accuracy', () => {
    renderWithRouter(
      <SessionComplete score={5} total={10} />
    );

    expect(screen.getByText('Session Complete!')).toBeInTheDocument();
    expect(screen.getByText(/You scored/)).toBeInTheDocument();
    expect(screen.getByText('5 / 10')).toBeInTheDocument();
    expect(screen.queryByText(/accuracy/)).not.toBeInTheDocument();
  });

  it('renders custom title and message', () => {
    renderWithRouter(
      <SessionComplete customTitle="Great Job!" customMessage="You are a star." />
    );

    expect(screen.getByText('Great Job!')).toBeInTheDocument();
    expect(screen.getByText('You are a star.')).toBeInTheDocument();
    expect(screen.queryByText(/You scored/)).not.toBeInTheDocument();
  });

  it('renders next routes properly', () => {
    const nextRoutes = ['mcq', 'spelling'];
    renderWithRouter(
      <SessionComplete nextRoutes={nextRoutes} levelParam="2" />
    );

    expect(screen.getByText('Ready for the Next Challenge?')).toBeInTheDocument();

    const mcqLink = screen.getByText('MCQ Quiz').closest('a');
    expect(mcqLink).toHaveAttribute('href', '/mcq?level=2');

    const spellingLink = screen.getByText('Spelling Master').closest('a');
    expect(spellingLink).toHaveAttribute('href', '/spelling?level=2');
  });

  it('renders next routes properly without levelParam', () => {
    const nextRoutes = ['matching'];
    renderWithRouter(
      <SessionComplete nextRoutes={nextRoutes} />
    );

    const matchingLink = screen.getByText('Matching Drill').closest('a');
    expect(matchingLink).toHaveAttribute('href', '/matching');
  });

  it('ignores invalid next routes', () => {
    const nextRoutes = ['invalid_route', 'quiz'];
    renderWithRouter(
      <SessionComplete nextRoutes={nextRoutes} />
    );

    expect(screen.getByText('Mastery Quiz')).toBeInTheDocument();
    // 'invalid_route' should not render anything that breaks the component
  });

  it('calls onReturn when the return button is clicked', () => {
    const onReturn = vi.fn();
    renderWithRouter(
      <SessionComplete onReturn={onReturn} />
    );

    const returnButton = screen.getByRole('button', { name: /Return Home/i });
    fireEvent.click(returnButton);
    expect(onReturn).toHaveBeenCalledTimes(1);
  });

  it('renders a return Link if onReturn is not provided', () => {
    renderWithRouter(
      <SessionComplete returnUrl="/dashboard" returnLabel="Go to Dashboard" />
    );

    const returnLink = screen.getByRole('link', { name: /Go to Dashboard/i });
    expect(returnLink).toHaveAttribute('href', '/dashboard');
  });

  it('renders return Link using levelParam if returnUrl is not provided', () => {
    renderWithRouter(
      <SessionComplete levelParam="5" />
    );

    const returnLink = screen.getByRole('link', { name: /Return to Level 5/i });
    expect(returnLink).toHaveAttribute('href', '/study-level/5');
  });

  it('calls onRetry when the retry button is clicked', () => {
    const onRetry = vi.fn();
    renderWithRouter(
      <SessionComplete onRetry={onRetry} />
    );

    const retryButton = screen.getByRole('button', { name: /Challenge Again/i });
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders children correctly', () => {
    renderWithRouter(
      <SessionComplete>
        <div data-testid="custom-child">Custom Child</div>
      </SessionComplete>
    );

    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
  });
});
