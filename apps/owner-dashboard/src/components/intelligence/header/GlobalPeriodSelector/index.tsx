'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@repo/ui';
import { Calendar, ChevronDown, Check } from 'lucide-react';

import {
  usePeriod,
  PERIOD_OPTIONS,
  PERIOD_SHORT,
} from '@/providers/period-provider';

const outlineBtn =
  'font-inter h-9 gap-1.5 rounded-md border border-[#e8e4de] bg-white px-4 text-sm font-medium text-intel-text shadow-none hover:bg-[#faf9f7]';

export const GlobalPeriodSelector = () => {
  const { period, setPeriod } = usePeriod();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        className={outlineBtn}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Calendar className="size-3.5 text-intel-text-muted" />
        {PERIOD_SHORT[period]}
        <ChevronDown className="size-3.5 text-intel-text-muted" />
      </Button>
      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-md border border-[#e8e4de] bg-white py-1 shadow-lg"
        >
          {PERIOD_OPTIONS.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                role="option"
                aria-selected={period === opt.value}
                onClick={() => {
                  setPeriod(opt.value);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-intel-text hover:bg-[#faf9f7]"
              >
                {opt.label}
                {period === opt.value ? (
                  <Check className="size-3.5 text-intel-maroon" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
