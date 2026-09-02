import { render, fireEvent } from '@testing-library/react';
import SettingsAccount from './SettingsAccount';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock lucide-react icons so we can differentiate them in tests
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Check: (props) => <div data-testid="check-icon" {...props} />,
    ChevronRight: (props) => <div data-testid="chevron-right-icon" {...props} />,
  };
});

describe('SettingsAccount', () => {
  it('renders all account sections', () => {
    const { getByText } = render(
      <SettingsAccount user={{ email: 'test@example.com' }} copyEmail={vi.fn()} copied={false} />
    );

    expect(getByText('Workspace Scope')).toBeInTheDocument();
    expect(getByText('Plan Status')).toBeInTheDocument();
    expect(getByText('Billing Details')).toBeInTheDocument();
    expect(getByText('Account Email')).toBeInTheDocument();
  });

  it('renders user email correctly', () => {
    const { getByText } = render(
      <SettingsAccount user={{ email: 'test@example.com', uid: '123' }} copyEmail={vi.fn()} copied={false} />
    );
    expect(getByText('test@example.com')).toBeInTheDocument();
  });

  it('shows "No email" fallback when user has no email', () => {
    const { getByText } = render(
      <SettingsAccount user={{ uid: '123' }} copyEmail={vi.fn()} copied={false} />
    );
    expect(getByText('No email')).toBeInTheDocument();
  });

  it('calls copyEmail when email section is clicked', () => {
    const copyEmailMock = vi.fn();
    const { getByText } = render(
      <SettingsAccount user={{ email: 'test@example.com' }} copyEmail={copyEmailMock} copied={false} />
    );

    const emailSection = getByText('Account Email');
    // The onClick is attached to the parent div of "Account Email"
    // Since getByText gets the <p> element, we can click it directly and the event will bubble up
    fireEvent.click(emailSection);

    expect(copyEmailMock).toHaveBeenCalledTimes(1);
  });

  it('toggles icon based on copied state', () => {
    const { getByTestId, rerender, queryByTestId } = render(
      <SettingsAccount user={{ email: 'test@example.com' }} copyEmail={vi.fn()} copied={false} />
    );

    expect(getByTestId('chevron-right-icon')).toBeInTheDocument();
    expect(queryByTestId('check-icon')).not.toBeInTheDocument();

    rerender(
      <SettingsAccount user={{ email: 'test@example.com' }} copyEmail={vi.fn()} copied={true} />
    );

    expect(getByTestId('check-icon')).toBeInTheDocument();
    expect(queryByTestId('chevron-right-icon')).not.toBeInTheDocument();
  });
});
