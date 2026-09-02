import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BugReportModal from './BugReportModal';

describe('BugReportModal', () => {
  const defaultProps = {
    showBugModal: true,
    setShowBugModal: vi.fn(),
    bugText: '',
    setBugText: vi.fn(),
    submitting: false,
    submitBug: vi.fn((e) => e.preventDefault()),
  };

  it('does not render when showBugModal is false', () => {
    render(<BugReportModal {...defaultProps} showBugModal={false} />);
    expect(screen.queryByText('Report System Bug')).not.toBeInTheDocument();
  });

  it('renders correctly when showBugModal is true', () => {
    render(<BugReportModal {...defaultProps} />);
    expect(screen.getByText('Report System Bug')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Describe what occurred/i)).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Submit Report')).toBeInTheDocument();
  });

  it('calls setBugText when typing in the textarea', () => {
    render(<BugReportModal {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/Describe what occurred/i);
    fireEvent.change(textarea, { target: { value: 'New bug description' } });
    expect(defaultProps.setBugText).toHaveBeenCalledWith('New bug description');
  });

  it('calls setShowBugModal with false when clicking the close (X) button', () => {
    render(<BugReportModal {...defaultProps} />);
    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);
    expect(defaultProps.setShowBugModal).toHaveBeenCalledWith(false);
  });

  it('calls setShowBugModal with false when clicking the Cancel button', () => {
    render(<BugReportModal {...defaultProps} />);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(defaultProps.setShowBugModal).toHaveBeenCalledWith(false);
  });

  it('calls submitBug when submitting the form', () => {
    const submitBugMock = vi.fn((e) => e.preventDefault());
    render(<BugReportModal {...defaultProps} bugText="Some bug text" submitBug={submitBugMock} />);
    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);
    expect(submitBugMock).toHaveBeenCalled();
  });

  it('Submit button is disabled when submitting is true', () => {
    render(<BugReportModal {...defaultProps} submitting={true} bugText="Some bug text" />);
    const submitButton = screen.getByText('Submitting...');
    expect(submitButton).toBeDisabled();
  });

  it('Submit button is disabled when bugText is empty', () => {
    render(<BugReportModal {...defaultProps} bugText="" />);
    const submitButton = screen.getByText('Submit Report');
    expect(submitButton).toBeDisabled();
  });

  it('Submit button is enabled when bugText is not empty and submitting is false', () => {
    render(<BugReportModal {...defaultProps} bugText="Some bug text" />);
    const submitButton = screen.getByText('Submit Report');
    expect(submitButton).not.toBeDisabled();
  });

  it('calls setShowBugModal with false when clicking the backdrop', () => {
    const { container } = render(<BugReportModal {...defaultProps} />);
    // The backdrop is the first motion.div inside the AnimatePresence.
    // We can find it by looking for the fixed inset-0 class.
    const backdrop = container.querySelector('.fixed.inset-0.z-50');
    fireEvent.click(backdrop);
    expect(defaultProps.setShowBugModal).toHaveBeenCalledWith(false);
  });
});
