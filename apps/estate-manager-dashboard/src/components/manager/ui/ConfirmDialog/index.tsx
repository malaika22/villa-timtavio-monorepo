'use client';

import { Loader2, TriangleAlert } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui';
import { cn } from '@repo/ui/lib/utils';

/**
 * Asking before something irreversible, in the estate's own voice.
 *
 * `window.confirm` was doing this job: a grey Chrome sheet bolted to the top of
 * the browser, naming the origin before the question and offering "OK" as the
 * word for deleting a dish. It reads as a browser warning rather than a
 * considered question, which is exactly backwards for the one moment a manager
 * should slow down and look.
 *
 * The name of the thing goes in the title, and the button says the verb —
 * "Remove dish", never "OK".
 */
export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Keep it',
  tone = 'danger',
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  /** The verb, not an acknowledgement. "Remove dish", "Check out". */
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'danger' | 'neutral';
  busy?: boolean;
  onConfirm: () => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <div className="flex items-start gap-3">
          {tone === 'danger' && (
            <span
              className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#fdf3f1]"
              aria-hidden
            >
              <TriangleAlert className="size-4 text-[#b42318]" />
            </span>
          )}
          <div className="min-w-0">
            <DialogTitle className="text-left">{title}</DialogTitle>
            {description && (
              <DialogDescription className="mt-1 text-left">
                {description}
              </DialogDescription>
            )}
          </div>
        </div>
      </DialogHeader>

      <DialogFooter className="gap-2 sm:gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={busy}
          className="border-manager-border bg-white text-manager-text"
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={cn(
            'text-white hover:opacity-90',
            tone === 'danger' ? 'bg-[#b42318]' : 'bg-manager-accent',
          )}
        >
          {busy && <Loader2 className="mr-1.5 size-4 animate-spin" />}
          {confirmLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
