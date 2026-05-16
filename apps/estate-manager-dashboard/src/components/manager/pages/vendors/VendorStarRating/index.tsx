import { Star } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

export const VendorStarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
    {Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          'size-3.5',
          i < Math.floor(rating) ? 'fill-[#c4a882] text-[#c4a882]' : 'fill-none text-[#e0d6c8]',
        )}
        strokeWidth={1.5}
      />
    ))}
  </div>
);
