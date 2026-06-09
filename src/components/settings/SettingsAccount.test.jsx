import { render } from '@testing-library/react';
import SettingsAccount from './SettingsAccount';
import { describe, it, expect, vi } from 'vitest';

describe('SettingsAccount', () => {
  it('renders user email', () => {
    const { getByText } = render(
      <SettingsAccount user={{ email: 'test@example.com', uid: '123' }} copyEmail={vi.fn()} copied={false} />
    );
    expect(getByText('test@example.com')).toBeInTheDocument();
  });
});
