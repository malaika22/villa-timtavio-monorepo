'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-manager-text group-[.toaster]:border-manager-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-manager-text-muted',
          actionButton:
            'group-[.toast]:bg-manager-accent group-[.toast]:text-white',
          cancelButton:
            'group-[.toast]:bg-manager-main group-[.toast]:text-manager-text',
        },
      }}
      {...props}
    />
  );
}
