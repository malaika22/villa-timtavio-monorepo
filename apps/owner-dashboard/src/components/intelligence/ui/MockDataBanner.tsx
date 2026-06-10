import { AlertTriangle } from 'lucide-react';

interface Props {
  message?: string;
}

export function MockDataBanner({
  message = 'Live data requires analytics API — showing sample data.',
}: Props) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
      <AlertTriangle className="size-4 shrink-0" strokeWidth={1.75} />
      <p className="text-xs font-medium">{message}</p>
    </div>
  );
}
