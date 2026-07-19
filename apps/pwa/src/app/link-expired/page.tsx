'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Clock } from 'lucide-react';

export default function LinkExpiredPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [message, setMessage] = useState('');

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch('/api/auth/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      setMessage(
        data.message ??
          'If that email is on a reservation, a new access link is on its way.',
      );
    } catch {
      setMessage(
        'If that email is on a reservation, a new access link is on its way.',
      );
    } finally {
      setStatus('sent');
    }
  };

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

        {status === 'sent' ? (
          <p className="mt-2 max-w-[300px] text-[13px] leading-relaxed text-[#C8A96E]">
            {message}
          </p>
        ) : (
          <form
            onSubmit={handleRequest}
            className="mt-2 flex w-full max-w-[300px] flex-col gap-2.5"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email on your reservation"
              className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-3 text-[13px] text-white outline-none placeholder:text-white/40 focus:border-[#C8A96E]/60"
            />
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full rounded-full bg-[#C8A96E] px-4 py-3 text-[11px] font-semibold uppercase tracking-[2px] text-[#0F1F2E] transition-opacity active:opacity-90 disabled:opacity-60"
            >
              {status === 'sending' ? 'Sending…' : 'Send me a new link'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
