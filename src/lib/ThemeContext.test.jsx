import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeContext';

// Dummy component to test useTheme hook
const TestComponent = () => {
  const { themeMode, setThemeMode } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{themeMode}</span>
      <button onClick={() => setThemeMode('dark')}>Set Dark</button>
      <button onClick={() => setThemeMode('light')}>Set Light</button>
      <button onClick={() => setThemeMode('classic')}>Set Classic</button>
      <button onClick={() => setThemeMode('system')}>Set System</button>
    </div>
  );
};

describe('ThemeContext', () => {
  let mockMatchMedia;

  beforeEach(() => {
    // Clear localStorage and document classes before each test
    localStorage.clear();
    document.documentElement.className = '';

    // Setup matchMedia mock
    mockMatchMedia = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => mockMatchMedia));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('initializes with classic theme by default', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('classic');
    expect(document.documentElement.classList.contains('classic')).toBe(true);
    expect(localStorage.getItem('lexora-theme-mode')).toBe('classic');
  });

  it('initializes with theme from localStorage if available', () => {
    localStorage.setItem('lexora-theme-mode', 'dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('updates theme when setThemeMode is called', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Initial state
    expect(document.documentElement.classList.contains('classic')).toBe(true);

    // Switch to dark
    act(() => {
      screen.getByText('Set Dark').click();
    });
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('classic')).toBe(false);
    expect(localStorage.getItem('lexora-theme-mode')).toBe('dark');

    // Switch to light
    act(() => {
      screen.getByText('Set Light').click();
    });
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('lexora-theme-mode')).toBe('light');
  });

  it('applies system theme correctly when system mode is selected', () => {
    mockMatchMedia.matches = true; // System is dark

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    act(() => {
      screen.getByText('Set System').click();
    });

    expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('lexora-theme-mode')).toBe('system');
    expect(mockMatchMedia.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    // Cleanup: unmount should remove the event listener
    // This is hard to test directly without full unmount testing,
    // but we can test that it responds to changes
  });

  it('updates theme when system theme changes in system mode', () => {
    let changeListener;
    mockMatchMedia.addEventListener = vi.fn((event, listener) => {
      if (event === 'change') changeListener = listener;
    });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Set to system mode
    act(() => {
      screen.getByText('Set System').click();
    });

    expect(document.documentElement.classList.contains('light')).toBe(true); // Default mock matches=false

    // Simulate system theme changing to dark
    act(() => {
      mockMatchMedia.matches = true;
      if (changeListener) changeListener();
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('throws an error if useTheme is used outside of ThemeProvider', () => {
    // Suppress console.error for this expected error test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow('useTheme must be used within a ThemeProvider');

    consoleSpy.mockRestore();
  });
});
