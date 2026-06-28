'use client';

import { motion } from 'motion/react';
import { Clock } from 'lucide-react';

export default function LinkExpiredPage() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0F1F2E',
        padding: '32px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 0.16, scale: 1 }}
        transition={{ duration: 2.4, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          width: '60vw',
          height: '60vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #C8A96E 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center gap-5"
      >
        <span className="flex size-16 items-center justify-center rounded-full border border-[#C8A96E]/40 bg-[#C8A96E]/10">
          <Clock
            className="size-7 text-[#C8A96E]"
            strokeWidth={1.5}
            aria-hidden
          />
        </span>

        <div className="space-y-2">
          <h1 className="font-cormorant text-[28px] italic leading-tight text-white">
            This link has expired
          </h1>
          <p className="mx-auto max-w-[300px] text-[13px] leading-relaxed text-white/65">
            Your secure access link is no longer active. Access links expire 24
            hours after checkout, and used links can&apos;t be reopened.
          </p>
        </div>

        <p className="mt-2 max-w-[300px] text-[11px] uppercase tracking-[2px] text-white/45">
          Need access again? Contact the estate and we&apos;ll send a fresh
          link.
        </p>
      </motion.div>
    </div>
  );
}
