import { DashboardCard } from '@repo/dashboard-ui';
import { cn } from '@repo/ui/lib/utils';

import type { CurrentBooking } from '@/types';

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="mb-4 last:mb-0">
    <h4 className="mb-2 text-[10px] font-medium tracking-[0.14em] text-manager-text-muted uppercase">
      {title}
    </h4>
    {children}
  </div>
);

const EmptyHint = ({ text }: { text: string }) => (
  <p className="text-sm italic text-manager-text-muted">{text}</p>
);

export const BookingPreferencesCard = ({
  booking,
}: {
  booking: CurrentBooking;
}) => (
  <DashboardCard variant="manager" className="p-5">
    <h3 className="mb-4 text-sm font-semibold text-manager-text">
      Guest Preferences
    </h3>

    <Section title="Dietary">
      {booking.dietary.length === 0 ? (
        <EmptyHint text="No dietary preferences on file." />
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {booking.dietary.map((tag) => {
            const isAlert = tag === booking.dietaryAlert;
            return (
              <span
                key={tag}
                className={cn(
                  'rounded-full border px-3 py-1 text-sm',
                  isAlert
                    ? 'border-[#f5c6c6] bg-[#fef2f2] text-[#c53030]'
                    : 'border-[#e5e0d8] bg-white text-manager-text',
                )}
              >
                {tag}
              </span>
            );
          })}
        </div>
      )}
    </Section>

    <Section title="Beverages">
      {booking.beverages.length === 0 ? (
        <EmptyHint text="No beverage preferences on file." />
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {booking.beverages.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#e5e0d8] bg-white px-3 py-1 text-sm text-manager-text"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Section>

    <Section title="Room Setup">
      {booking.roomSetup ? (
        <p className="text-sm text-manager-text">{booking.roomSetup}</p>
      ) : (
        <EmptyHint text="No room setup notes recorded." />
      )}
    </Section>

    <Section title="Notes">
      {booking.staffNote.text ? (
        <div className="rounded-lg border border-[#e8dcc8] bg-[#fff5eb] p-4">
          <p className="text-sm leading-relaxed text-manager-text">
            {booking.staffNote.text}
          </p>
          {booking.staffNote.attribution ? (
            <p className="mt-2 text-sm text-manager-text-muted">
              {booking.staffNote.attribution}
            </p>
          ) : null}
        </div>
      ) : (
        <EmptyHint text="No internal notes for this booking." />
      )}
    </Section>
  </DashboardCard>
);
