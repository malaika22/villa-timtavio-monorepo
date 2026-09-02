'use client';

import { cn } from '@repo/ui/lib/utils';

/**
 * A text field that grows with what is typed into it.
 *
 * Allergies and beverage notes were single-line inputs, so anything past the
 * width of the field scrolled out of sight while the guest was still writing
 * it — on the one field the kitchen treats as medical. "Severe shellfish
 * allergy — carries an EpiPen" cannot be checked for typos if only the last
 * six words are ever on screen.
 *
 * Sized by the browser rather than by state: the height is written straight
 * onto the node, so nothing re-renders per keystroke and there is no effect
 * chasing the value. The ref callback runs on mount too, which is what sizes
 * a field that opens already full.
 */
export function AutoGrowTextarea({
  className,
  onChange,
  rows = 2,
  ...props
}: React.ComponentProps<'textarea'>) {
  const fit = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    // Collapse first: without it the box can only ever get taller, and
    // deleting three lines leaves three lines of empty field behind.
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  return (
    <textarea
      ref={fit}
      rows={rows}
      onChange={(e) => {
        fit(e.currentTarget);
        onChange?.(e);
      }}
      className={cn('resize-none', className)}
      {...props}
    />
  );
}
