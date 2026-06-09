import { render } from '@testing-library/react';
import SettingsProfile from './SettingsProfile';
import { describe, it, expect } from 'vitest';

describe('SettingsProfile', () => {
  it('renders user details', () => {
    const { getByText } = render(<SettingsProfile user={{ name: 'Test User', email: 'test@example.com' }} />);
    expect(getByText('Test User')).toBeInTheDocument();
    expect(getByText('test@example.com')).toBeInTheDocument();
  });
});
