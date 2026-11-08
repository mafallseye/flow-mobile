import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Palette identique à la version web de Flow. */
const light = {
  mode: 'light',
  bg: '#f6f7fb',
  surface: '#ffffff',
  surface2: '#f1f2f8',
  border: '#e6e8f0',
  text: '#171a2b',
  text2: '#5d6481',
  text3: '#9aa0b8',
  primary: '#6a5cff',
  primarySoft: '#eeebff',
  grad: ['#7c5cff', '#4f8bff'],
  danger: '#ef4565',
  dangerSoft: '#ffe9ee',
  warn: '#f59f0a',
  warnSoft: '#fff4e0',
  ok: '#16b37d',
  okSoft: '#e3f8f0',
  backdrop: 'rgba(10,12,25,0.45)',
};

const dark = {
  ...light,
  mode: 'dark',
  bg: '#0d0f17',
  surface: '#161926',
  surface2: '#1d2131',
  border: '#262b3e',
  text: '#eef0fa',
  text2: '#a3a9c4',
  text3: '#666d8a',
  primary: '#8b7dff',
  primarySoft: '#262447',
  dangerSoft: '#3a1823',
  warnSoft: '#3a2c12',
  okSoft: '#12322a',
  backdrop: 'rgba(0,0,0,0.6)',
};

const STORAGE_KEY = 'flow.theme';
const ThemeContext = createContext(null);

/** Thème : suit le système par défaut, surchargeable et persistant. */
export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [override, setOverride] = useState(null); // 'light' | 'dark' | null

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => (v === 'light' || v === 'dark') && setOverride(v))
      .catch(() => {});
  }, []);

  const mode = override ?? (system === 'dark' ? 'dark' : 'light');

  const toggle = useCallback(() => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setOverride(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, [mode]);

  const value = useMemo(() => ({ colors: mode === 'dark' ? dark : light, toggle }), [mode, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme doit être utilisé dans <ThemeProvider>.');
  return ctx;
}

export const radius = { sm: 10, md: 14, lg: 16, xl: 24 };
