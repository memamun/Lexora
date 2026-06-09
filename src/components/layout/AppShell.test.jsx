import { render } from '@testing-library/react';
import AppShell from './AppShell';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/lib/NavigationContext', () => ({
  useNavigation: () => ({ isNavOpen: true, setIsNavOpen: vi.fn(), closeMobile: vi.fn() })
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: { email: 'test@example.com' }, logout: vi.fn() })
}));

vi.mock('@/lib/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, toggleTheme: vi.fn() })
}));

// Provide a fully mocked motion object and mock LexoraLogo
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    motion: { div: 'div', button: 'button', nav: 'nav', aside: 'aside', span: 'span', svg: 'svg', path: 'path', g: 'g', rect: 'rect', defs: 'defs', linearGradient: 'linearGradient', stop: 'stop' },
    AnimatePresence: ({ children }) => <>{children}</>
  };
});

vi.mock('@/components/ui/LexoraLogo', () => ({
  __esModule: true,
  default: () => <div>LexoraLogoMock</div>
}));

describe('AppShell', () => {
  it('renders correctly', () => {
    const { getAllByText } = render(
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    );
    expect(getAllByText('test@example.com').length).toBeGreaterThan(0);
  });
});
