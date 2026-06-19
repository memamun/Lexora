import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test Error');
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for expected errors during rendering
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>All Good!</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('All Good!')).toBeInTheDocument();
  });

  it('catches error and generates a valid UUID for errorId', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Should display the fallback UI
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Verify error ID format (UUID)
    const errorIdNode = screen.getByText(/Error ID:/);
    expect(errorIdNode).toBeInTheDocument();

    // Extract the UUID part
    const errorIdText = errorIdNode.textContent;
    const uuid = errorIdText.replace('Error ID: ', '').trim();

    // UUID v4 regex validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(uuidRegex);
  });
});
