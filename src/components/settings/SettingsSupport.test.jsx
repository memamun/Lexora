import { render } from '@testing-library/react';
import SettingsSupport from './SettingsSupport';
import { describe, it, expect, vi } from 'vitest';

describe('SettingsSupport', () => {
  it('renders support section', () => {
    const { getByText } = render(
      <SettingsSupport testSpeech={vi.fn()} setShowBugModal={vi.fn()} />
    );
    expect(getByText('Preferences & Support')).toBeInTheDocument();
  });
});
