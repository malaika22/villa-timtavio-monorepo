import { AlertTriangle } from 'lucide-react';

export const ConflictDetectedBanner = ({ message }: { message: string }) => (
  <div
    className="rounded-lg border border-[#e8d4b8] bg-[#fef6eb] px-4 py-3.5"
    role="alert"
  >
    <div className="flex gap-2.5">
      <AlertTriangle
        className="mt-0.5 size-4 shrink-0 text-[#b45309]"
        strokeWidth={2}
      />
      <div>
        <p className="text-sm font-semibold text-manager-text">
          Conflict Detected
        </p>
        <p className="mt-1 text-[15px] leading-relaxed text-manager-text-muted">
          {message}
        </p>
      </div>
    </div>
  </div>
);
