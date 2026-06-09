import { render } from '@testing-library/react';
import SettingsVisual from './SettingsVisual';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

describe('SettingsVisual', () => {
  it('renders visual section', () => {
    const ACCENTS = {
      indigo: { label: 'Indigo', bg: 'bg-indigo-500', iconBg: 'bg-indigo-500/10', iconColor: 'text-indigo-500', border: 'border-indigo-500', ring: 'ring-indigo-500/20' }
    };

    const { getByText } = render(
      <SettingsVisual
        ACCENTS={ACCENTS}
        themeMode="system"
        setThemeMode={vi.fn()}
        accentColor="indigo"
        setAccentColor={vi.fn()}
      />
    );
    expect(getByText('Visual Settings')).toBeInTheDocument();
  });
});
