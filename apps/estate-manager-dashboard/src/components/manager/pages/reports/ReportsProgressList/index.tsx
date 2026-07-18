import type { ReportsProgressRow } from '@/lib/reports-mock-data';

type Props = {
  rows: ReportsProgressRow[];
  footer?: { label: string; value: string };
};

export const ReportsProgressList = ({ rows, footer }: Props) => (
  <ul className="space-y-4">
    {rows.map((row) => (
      <li key={row.id}>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <span className="font-inter text-sm text-manager-text">
            {row.label}
          </span>
          <span className="font-inter shrink-0 text-sm text-manager-text-muted">
            {row.detail}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#ebe6df]">
          <div
            className="h-full rounded-full bg-manager-accent"
            style={{ width: `${row.percent}%` }}
          />
        </div>
      </li>
    ))}
    {footer ? (
      <li className="flex items-center justify-between border-t border-[#ebe6df] pt-4">
        <span className="font-inter text-sm font-medium text-manager-text">
          {footer.label}
        </span>
        <span className="font-cormorant text-xl leading-none text-manager-text">
          {footer.value}
        </span>
      </li>
    ) : null}
  </ul>
);
