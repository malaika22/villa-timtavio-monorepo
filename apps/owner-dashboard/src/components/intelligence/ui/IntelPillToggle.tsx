'use client';

import { cn } from '@repo/ui/lib/utils';

type Option<T extends string> = { value: T; label: string };

export const IntelPillToggle = <T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) => (
  <div
    className={cn(
      'inline-flex flex-wrap rounded-md border border-intel-border bg-intel-main p-0.5',
      className,
    )}
  >
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={cn(
          'rounded px-2.5 py-1 text-[11px] transition-colors',
          value === opt.value
            ? 'bg-intel-maroon text-white'
            : 'bg-white text-intel-text-muted hover:text-intel-text',
        )}
      >
        {opt.label}
      </button>
    ))}
  </div>
);
