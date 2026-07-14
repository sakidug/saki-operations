import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { type BrandId } from '../tokens';

export type ThemeMode = 'dark' | 'light';

type ThemeContextValue = {
  theme: ThemeMode;
  brand: BrandId;
  setTheme: (theme: ThemeMode) => void;
  setBrand: (brand: BrandId) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = 'saki-operations.theme';
const BRAND_KEY = 'saki-operations.brand';

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(THEME_KEY);
  return stored === 'light' ? 'light' : 'dark';
}

function getStoredBrand(): BrandId {
  if (typeof window === 'undefined') return 'tours';
  const stored = window.localStorage.getItem(BRAND_KEY);
  if (stored === 'hhco' || stored === 'office' || stored === 'admin' || stored === 'tours') {
    return stored;
  }
  return 'tours';
}

export type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: ThemeMode;
  defaultBrand?: BrandId;
};

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  defaultBrand = 'tours',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme() || defaultTheme);
  const [brand, setBrandState] = useState<BrandId>(() => getStoredBrand() || defaultBrand);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    root.dataset.brand = brand;
    root.dataset.theme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
    window.localStorage.setItem(BRAND_KEY, brand);
  }, [theme, brand]);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
  }, []);

  const setBrand = useCallback((next: BrandId) => {
    setBrandState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({ theme, brand, setTheme, setBrand, toggleTheme }),
    [theme, brand, setTheme, setBrand, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
