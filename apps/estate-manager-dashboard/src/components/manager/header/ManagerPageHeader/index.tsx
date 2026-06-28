'use client';

import { Button } from '@repo/ui';
import { Download, Eye, Filter, Plus } from 'lucide-react';

import { MobileManagerNav } from '@/components/manager/sidebar/MobileManagerNav';
import { NotificationBell } from '@/components/manager/header/NotificationBell';
import type { PageMeta } from '@/config/navigation';

const outlineBtn =
  'font-inter h-9 gap-1.5 rounded-md border border-[#e8e4de] bg-white px-4 text-sm font-medium text-manager-text shadow-none hover:bg-[#faf9f7]';
const outlineIconBtn =
  'size-9 rounded-md border border-[#e8e4de] bg-white shadow-none hover:bg-[#faf9f7]';
const primaryBtn =
  'font-inter h-9 gap-1.5 rounded-md border-0 bg-manager-accent px-4 text-sm font-medium text-white shadow-none hover:bg-manager-accent-muted';

export const ManagerPageHeader = ({
  meta,
  lodgifySync,
  subtitle,
  onExport,
  isExporting,
  onAddContentItem,
}: {
  meta: PageMeta;
  lodgifySync?: string;
  subtitle?: string;
  onExport?: () => void;
  isExporting?: boolean;
  onAddContentItem?: () => void;
}) => (
  <header className="flex shrink-0 flex-col gap-2 border-y border-[#e8e4de] bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
    <div className="flex items-center gap-3">
      <MobileManagerNav />
      <div>
        <h1 className="font-cormorant text-[28px] leading-tight font-normal text-manager-text">
          {meta.title}
        </h1>
        <p className="font-inter mt-0.5 text-sm text-manager-text-muted">
          {subtitle ?? meta.subtitle}
        </p>
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      {(lodgifySync ?? meta.lodgifySync) ? (
        <span className="font-inter mr-1 hidden items-center gap-2 text-sm text-manager-text-muted sm:inline-flex">
          <span className="size-2 shrink-0 rounded-full bg-[#1e7e34]" />
          {lodgifySync ?? meta.lodgifySync}
        </span>
      ) : null}
      {meta.showPreviewGuestView ? (
        <Button variant="outline" className={outlineBtn}>
          <Eye className="size-4 text-manager-text-muted" />
          Preview Guest View
        </Button>
      ) : null}
      {meta.showExport ? (
        <Button
          variant="outline"
          className={outlineBtn}
          onClick={onExport}
          disabled={!onExport || isExporting}
        >
          <Download className="size-3.5 text-manager-text-muted" />
          {isExporting ? 'Exporting…' : (meta.exportLabel ?? 'Export')}
        </Button>
      ) : null}
      {meta.showAddGuest ? (
        <Button className={primaryBtn}>
          <Plus className="size-4" />
          Add Guest
        </Button>
      ) : null}
      {meta.showAddVendor ? (
        <Button className={primaryBtn}>
          <Plus className="size-4" />
          Add Vendor
        </Button>
      ) : null}
      {meta.showAddContentItem ? (
        <Button className={primaryBtn} onClick={onAddContentItem}>
          <Plus className="size-4" />
          Add Item
        </Button>
      ) : null}
      {meta.showFilterButton ? (
        <Button
          variant="outline"
          size="icon"
          className={outlineIconBtn}
          aria-label="Filter"
        >
          <Filter className="size-4 text-manager-text-muted" />
        </Button>
      ) : null}
      {meta.showNotifications ? <NotificationBell /> : null}
    </div>
  </header>
);
