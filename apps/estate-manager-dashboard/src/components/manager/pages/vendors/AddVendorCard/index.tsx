import { Plus } from 'lucide-react';

export const AddVendorCard = () => (
  <button
    type="button"
    className="font-inter flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-[#d4d0c8] bg-white p-8 text-center shadow-[0_1px_3px_rgba(26,22,20,0.04)] transition-colors hover:border-manager-accent/40 hover:bg-[#faf9f7]"
  >
    <span className="flex size-12 items-center justify-center rounded-full border border-[#e5e0d8] bg-[#f7f5f2]">
      <Plus className="size-6 text-manager-text-muted" strokeWidth={1.5} />
    </span>
    <p className="mt-4 text-sm font-medium text-manager-text">Add new vendor</p>
  </button>
);
