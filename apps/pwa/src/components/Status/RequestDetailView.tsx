'use client';

import { cn } from '@repo/ui/lib/utils';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
} from '@repo/ui/components/drawer';
import { Button } from '@repo/ui';
import { ArrowLeft, Phone } from 'lucide-react';
import Image from 'next/image';

import { StatusChip } from './StatusChip';
import {
  REQUEST_DETAIL_MOCK_DATA,
  STATUS_MOCK_DATA,
  type RequestTimelineStep,
} from './mockData';

interface RequestDetailViewProps {
  open: boolean;
  onClose: () => void;
  id: number | null;
}

export const RequestDetailView = ({
  open,
  onClose,
  id,
}: RequestDetailViewProps) => {
  const request = id != null ? STATUS_MOCK_DATA.find((r) => r.id === id) : null;
  const detail = id != null ? REQUEST_DETAIL_MOCK_DATA[id] : null;

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()} direction="right">
      <DrawerContent
        className={cn(
          'inset-y-0 right-0 left-auto w-full rounded-none border-none',
          'bg-[#F5F3EF] flex flex-col',
          'data-[vaul-drawer-direction=right]:w-full',
          'data-[vaul-drawer-direction=right]:rounded-none',
        )}
      >
        {/* Visually hidden title for accessibility */}
        <DrawerTitle className="sr-only">
          {request?.title ?? 'Request Detail'}
        </DrawerTitle>

        {/* Sticky header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E3E0DA] bg-[#F5F3EF] sticky top-0 z-10 shrink-0">
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 rounded-full hover:bg-[#EAE7E1] shrink-0"
              aria-label="Close"
            >
              <ArrowLeft size={14} className="text-[#2B2824]" />
            </Button>
          </DrawerClose>
          <span className="text-[9px] font-semibold uppercase tracking-[2px] text-[#2B2824]">
            Request Detail
          </span>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5">
          {!request || !detail ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 py-20">
              <p className="text-[13px] text-[#9A9288]">Request not found.</p>
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  className="text-[11px] font-medium text-[#3A5E48] underline underline-offset-2"
                >
                  Back to Status
                </Button>
              </DrawerClose>
            </div>
          ) : (
            <>
              {/* Summary card */}
              <div className="rounded-[10px] border border-[#E3E0DA] bg-white p-3 shadow-[0_1px_3px_rgba(15,31,46,0.04)]">
                <div className="flex items-center gap-3">
                  <div className="relative w-[52px] h-[52px] rounded-[8px] overflow-hidden shrink-0 bg-[#1A1A14]">
                    {detail.image && (
                      <Image
                        src={detail.image}
                        alt={request.title}
                        fill
                        className="object-cover opacity-80"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-cormorant text-[17px] font-medium leading-tight text-[#2B2824]">
                        {request.title}
                      </h2>
                      <StatusChip requestStatus={request.status} />
                    </div>
                    <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[1.2px] text-[#797168]">
                      {request.date} · {request.time} · {request.meta}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <section>
                <p className="mb-3 text-[8px] font-semibold uppercase tracking-[2px] text-[#9A9288]">
                  Request Status
                </p>
                <div className="flex flex-col">
                  {detail.timeline.map((step, index) => (
                    <TimelineStep
                      key={step.id}
                      step={step}
                      isLast={index === detail.timeline.length - 1}
                    />
                  ))}
                </div>
              </section>

              {/* Setup preview */}
              <section>
                <p className="mb-3 text-[8px] font-semibold uppercase tracking-[2px] text-[#9A9288]">
                  Setup Preview
                </p>
                <div className="rounded-[10px] overflow-hidden bg-[#141410] h-[160px] flex items-center justify-center">
                  <p className="text-[9px] font-medium uppercase tracking-[2px] text-[#4A4840]">
                    {detail.setupPreviewPlaceholder ??
                      'Photo will appear when ready'}
                  </p>
                </div>
                {detail.setupBy && (
                  <p className="mt-2 text-[8px] uppercase tracking-[1.4px] text-[#9A9288]">
                    {detail.setupBy}
                  </p>
                )}
              </section>

              {/* Contact actions */}
              <section>
                <p className="mb-3 text-[8px] font-semibold uppercase tracking-[2px] text-[#9A9288]">
                  Need to make a change?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={
                      detail.contactPhone ? `tel:${detail.contactPhone}` : '#'
                    }
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-[10px] border border-[#E3E0DA] bg-white py-3.5',
                      'text-[10px] font-semibold uppercase tracking-[1.6px] text-[#2B2824]',
                      'transition-colors hover:bg-[#F5F3F0]',
                    )}
                  >
                    <Phone size={12} aria-hidden />
                    Call Estate
                  </a>
                  <a
                    href={
                      detail.contactWhatsApp
                        ? `https://wa.me/${detail.contactWhatsApp.replace(/\D/g, '')}`
                        : '#'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-[10px] bg-[#2D5A3D] py-3.5',
                      'text-[10px] font-semibold uppercase tracking-[1.6px] text-white',
                      'transition-colors hover:bg-[#244D34]',
                    )}
                  >
                    <WhatsAppIcon />
                    WhatsApp
                  </a>
                </div>
              </section>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

function TimelineStep({
  step,
  isLast,
}: {
  step: RequestTimelineStep;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <StepIndicator state={step.state} />
        {!isLast && (
          <div
            className={cn(
              'w-px flex-1 my-1',
              step.state === 'completed' ? 'bg-[#2B2824]' : 'bg-[#D9D5CE]',
            )}
          />
        )}
      </div>
      <div className="pb-4">
        <p
          className={cn(
            'text-[13px] font-medium leading-tight',
            step.state === 'pending' ? 'text-[#C4C0B8]' : 'text-[#2B2824]',
          )}
        >
          {step.label}
        </p>
        {step.detail && (
          <p
            className={cn(
              'mt-0.5 text-[9px] font-medium uppercase tracking-[1.2px]',
              step.state === 'pending' ? 'text-[#D9D5CE]' : 'text-[#9A9288]',
            )}
          >
            {step.detail}
          </p>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ state }: { state: RequestTimelineStep['state'] }) {
  if (state === 'completed') {
    return (
      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#2B2824] shrink-0">
        <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden>
          <path
            d="M1 3L3 5L7 1"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }
  if (state === 'active') {
    return (
      <div className="flex items-center justify-center w-5 h-5 rounded-full border-[2.5px] border-[#2B2824] shrink-0">
        <div className="w-2 h-2 rounded-full bg-[#2B2824]" />
      </div>
    );
  }
  return (
    <div className="w-5 h-5 rounded-full border-[1.5px] border-[#D9D5CE] bg-white shrink-0" />
  );
}

function WhatsAppIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
