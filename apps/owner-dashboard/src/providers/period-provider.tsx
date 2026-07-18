'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

export type Period = 'mtd' | 'qtd' | '30d' | '90d' | 'ytd';

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'mtd', label: 'Month to date' },
  { value: 'qtd', label: 'Quarter to date' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'ytd', label: 'Year to date' },
];

export const PERIOD_SHORT: Record<Period, string> = {
  mtd: 'MTD',
  qtd: 'QTD',
  '30d': '30 days',
  '90d': '90 days',
  ytd: 'YTD',
};

const STORAGE_KEY = 'owner:period';

function readStoredPeriod(): Period {
  if (typeof window === 'undefined') return 'ytd';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && stored in PERIOD_SHORT) return stored as Period;
  return 'ytd';
}

type PeriodContextValue = {
  period: Period;
  setPeriod: (p: Period) => void;
};

const PeriodContext = createContext<PeriodContextValue | null>(null);

// Global date-range selection, inherited by every module. Persisted to
// localStorage so it survives navigation and reloads.
export function PeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriodState] = useState<Period>(readStoredPeriod);

  const setPeriod = useCallback((p: Period) => {
    setPeriodState(p);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, p);
    }
  }, []);

  return (
    <PeriodContext.Provider value={{ period, setPeriod }}>
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod(): PeriodContextValue {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error('usePeriod must be used within a PeriodProvider');
  return ctx;
}
