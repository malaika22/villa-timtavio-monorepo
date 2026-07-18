'use client';

import type { CSSProperties } from 'react';
import { Compass } from 'lucide-react';

import { cn } from '@repo/ui/lib/utils';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';

type ZoneConfig = {
  id: string;
  label: string;
  style: CSSProperties;
  heat?: 'high' | 'medium' | 'low' | 'none';
  variant?: 'villa' | 'amenity' | 'pool' | 'beach';
};

const heatOverlay: Record<NonNullable<ZoneConfig['heat']>, string> = {
  high: 'after:pointer-events-none after:absolute after:-inset-6 after:rounded-2xl after:content-[""] after:bg-[radial-gradient(ellipse_at_center,rgba(176,65,46,0.58)_0%,rgba(220,95,65,0.25)_38%,rgba(244,208,171,0.06)_58%,transparent_75%)]',
  medium:
    'after:pointer-events-none after:absolute after:-inset-4 after:rounded-xl after:content-[""] after:bg-[radial-gradient(ellipse_at_center,rgba(212,120,72,0.42)_0%,rgba(244,208,171,0.08)_50%,transparent_68%)]',
  low: 'after:pointer-events-none after:absolute after:-inset-3 after:rounded-lg after:content-[""] after:bg-[radial-gradient(ellipse_at_center,rgba(244,208,171,0.22)_0%,transparent_62%)]',
  none: '',
};

const surface = (variant: ZoneConfig['variant']) => {
  switch (variant) {
    case 'pool':
      return 'border border-[#8eb8ce] bg-[#d9ebf3] text-[#2a5f78] text-xs font-medium';
    case 'beach':
      return 'border border-[#d4c4b0] bg-[#ebe3d8] text-[10px] font-semibold tracking-[0.14em] text-intel-text-muted uppercase';
    case 'amenity':
      return 'border border-[#ddd5cc] bg-white/85 text-intel-text text-[11px]';
    default:
      return 'border border-[#ddd5cc] bg-[#e8e4df]/90 text-intel-text text-[11px]';
  }
};

const zones: ZoneConfig[] = [
  {
    id: 'v1',
    label: 'Villa 1',
    style: { top: 24, left: '5%', width: '11%', height: 40 },
    heat: 'none',
  },
  {
    id: 'v2',
    label: 'Villa 2',
    style: { top: 24, left: '18%', width: '11%', height: 40 },
    heat: 'low',
  },
  {
    id: 'v5',
    label: 'Villa 5',
    style: { top: 24, right: '22%', width: '11%', height: 40 },
    heat: 'none',
  },
  {
    id: 'spa',
    label: 'Spa & Wellness',
    style: { top: 20, right: '4%', width: '14%', height: 44 },
    heat: 'medium',
    variant: 'amenity',
  },
  {
    id: 'v4',
    label: 'Villa 4',
    style: { top: 92, left: '5%', width: '11%', height: 46 },
    heat: 'low',
  },
  {
    id: 'pool',
    label: 'Pool',
    style: {
      top: 88,
      left: '50%',
      width: '22%',
      height: 60,
      transform: 'translateX(-50%)',
    },
    heat: 'high',
    variant: 'pool',
  },
  {
    id: 'v3',
    label: 'Villa 3',
    style: { top: 92, right: '18%', width: '11%', height: 46 },
    heat: 'medium',
  },
  {
    id: 'v6',
    label: 'Villa 6',
    style: { top: 92, right: '5%', width: '11%', height: 46 },
    heat: 'low',
  },
  {
    id: 'dt',
    label: 'Dining Terrace',
    style: { top: 168, left: '5%', width: '17%', height: 42 },
    heat: 'medium',
    variant: 'amenity',
  },
  {
    id: 'beach',
    label: 'Beach Access',
    style: { bottom: 14, left: '4%', right: '4%', height: 36 },
    heat: 'medium',
    variant: 'beach',
  },
];

export const EstateHeatMap = ({ className }: { className?: string }) => (
  <IntelCard
    padding={false}
    className={cn(
      'flex h-full flex-col overflow-hidden bg-white shadow-[0_1px_2px_rgba(26,22,20,0.04)]',
      className,
    )}
  >
    {/* Map block — flex-1 centers map vertically; legend stays pinned below */}
    <div className="flex min-h-0 flex-1 items-center justify-center px-5 py-6 md:px-6 md:py-8">
      <div className="w-full overflow-hidden rounded-xl border border-[#e0d8cf] bg-[#f2ebe4]">
        <div className="relative h-[300px] w-full">
          <div
            className="pointer-events-none absolute top-[40%] left-1/2 z-0 h-[150px] w-[210px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(176,65,46,0.5)_0%,rgba(220,105,70,0.18)_42%,transparent_72%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute top-[20%] right-[7%] z-0 h-[72px] w-[72px] rounded-full bg-[radial-gradient(circle,rgba(212,120,72,0.34)_0%,transparent_65%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute top-[60%] left-[7%] z-0 h-[56px] w-[56px] rounded-full bg-[radial-gradient(circle,rgba(212,120,72,0.28)_0%,transparent_65%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-[58px] left-1/2 z-0 h-9 w-[90%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(212,120,72,0.26)_0%,transparent_70%)]"
            aria-hidden
          />

          <div className="absolute top-4 right-4 z-30 flex flex-col items-center text-[9px] text-intel-text-muted/55">
            <Compass className="size-4" strokeWidth={1.25} />
            <span>N</span>
          </div>

          {zones.map((z) => (
            <div
              key={z.id}
              className={`absolute z-10 ${heatOverlay[z.heat ?? 'none']}`}
              style={z.style}
            >
              <div
                className={`relative flex h-full w-full items-center justify-center rounded-md px-1 text-center leading-snug ${surface(z.variant)}`}
              >
                {z.label}
              </div>
            </div>
          ))}
        </div>

        <div className="flex h-9 items-center justify-center border-t border-[#d0e3ec] bg-[#e8f4f8]">
          <span className="text-[10px] font-semibold tracking-[0.2em] text-[#4a7a94] uppercase">
            Pacific Ocean
          </span>
        </div>
      </div>
    </div>

    <div className="shrink-0 border-t border-intel-border bg-white px-6 py-3.5 md:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[10px] text-intel-text-muted">
            Low activity
          </span>
          <div className="h-1.5 w-[100px] rounded-full bg-gradient-to-r from-[#f4d0ab] via-[#d47848] to-[#8b322c] sm:w-[120px]" />
          <span className="text-[10px] text-intel-text-muted">
            High activity
          </span>
        </div>
        <p className="text-[10px] text-intel-text-muted/80">
          Hover zones for detail · Real-time data updates every 15 min
        </p>
      </div>
    </div>
  </IntelCard>
);
