import { render } from '@testing-library/react';
import PageHeader from './PageHeader';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/lib/NavigationContext', () => ({
  useNavigation: () => ({ isNavOpen: false, setIsNavOpen: vi.fn(), closeMobile: vi.fn(), toggleNav: vi.fn(), openMobile: vi.fn() })
}));

describe('PageHeader', () => {
  it('renders correctly with title and subtitle', () => {
    const { getByText } = render(
      <BrowserRouter>
        <PageHeader title="Test Title" subtitle="Test Subtitle" />
      </BrowserRouter>
    );
    expect(getByText('Test Title')).toBeInTheDocument();
    expect(getByText('Test Subtitle')).toBeInTheDocument();
  });
});
