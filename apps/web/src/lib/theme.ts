const THEME_KEY = 'caseconnect-theme';

export type ThemeMode = 'light' | 'dark';

export function getStoredTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'dark' || v === 'light') return v;
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function toggleTheme(): ThemeMode {
  const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
