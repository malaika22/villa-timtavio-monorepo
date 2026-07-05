'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { Download, FileSpreadsheet, ImageDown } from 'lucide-react';

import { downloadCsv, downloadNodePng } from '@/lib/export';

type Props = {
  /** Base filename (no extension). */
  filename: string;
  /** Rows to export as CSV. Omit to hide the CSV option. */
  csvRows?: Record<string, unknown>[];
  /** Explicit CSV column order. */
  csvColumns?: string[];
  /** Ref to a node containing an <svg> to export as PNG. Omit to hide PNG. */
  pngTarget?: RefObject<HTMLElement | null>;
};

// Small per-chart/table export control: CSV for data, PNG for charts.
export const ExportMenu = ({ filename, csvRows, csvColumns, pngTarget }: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const hasCsv = !!csvRows && csvRows.length > 0;
  const hasPng = !!pngTarget;
  if (!hasCsv && !hasPng) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Export"
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex size-7 items-center justify-center rounded-md border border-[#e8e4de] bg-white text-intel-text-muted hover:bg-[#faf9f7] hover:text-intel-text"
      >
        <Download className="size-3.5" />
      </button>
      {open ? (
        <ul
          role="menu"
          className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-md border border-[#e8e4de] bg-white py-1 shadow-lg"
        >
          {hasCsv ? (
            <li>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  downloadCsv(filename, csvRows!, csvColumns);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-intel-text hover:bg-[#faf9f7]"
              >
                <FileSpreadsheet className="size-3.5 text-intel-text-muted" />
                Download CSV
              </button>
            </li>
          ) : null}
          {hasPng ? (
            <li>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  if (pngTarget?.current)
                    void downloadNodePng(pngTarget.current, filename);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-intel-text hover:bg-[#faf9f7]"
              >
                <ImageDown className="size-3.5 text-intel-text-muted" />
                Download PNG
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
};
