import { AlertTriangle } from 'lucide-react';

export const OperationsAlertBanner = ({ message }: { message: string }) => (
  <div
    className="flex items-start gap-2.5 rounded-lg border border-[#e8d4b8] bg-[#fef6eb] px-4 py-3"
    role="alert"
  >
    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#b45309]" strokeWidth={2} />
    <p className="text-sm leading-snug text-manager-text">{message}</p>
  </div>
);
