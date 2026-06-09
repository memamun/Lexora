import { render } from '@testing-library/react';
import SettingsEngine from './SettingsEngine';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/app-params', () => ({
  defaultParams: {
    APP_PARAM_EASE_FACTOR: 2.5,
    APP_PARAM_NEW_CARDS_PER_DAY: 20
  }
}));

describe('SettingsEngine', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <SettingsEngine
        easeFactor={2.5}
        setEaseFactor={vi.fn()}
        newCardsPerDay={20}
        setNewCardsPerDay={vi.fn()}
        hardInterval={1.2}
        setHardInterval={vi.fn()}
        goodInterval={2.5}
        setGoodInterval={vi.fn()}
        easyInterval={3.0}
        setEasyInterval={vi.fn()}
        saveEngineParams={vi.fn()}
        resetEngineParams={vi.fn()}
      />
    );
    expect(getByText('Daily Study Target')).toBeInTheDocument();
  });
});
