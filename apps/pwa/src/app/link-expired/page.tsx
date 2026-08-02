'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Clock } from 'lucide-react';

import { useAuthStore } from '@/store/auth/useAuthStore';
import { completeOtpSignIn } from '@/lib/auth/completeOtpSignIn';

const NEUTRAL =
  'If that email is on a reservation, a new access link is on its way.';

const inputClass =
  'w-full rounded-full border border-white/15 bg-white/5 px-4 py-3 text-[13px] text-white outline-none placeholder:text-white/40 focus:border-[#C8A96E]/60';
const buttonClass =
  'w-full rounded-full bg-[#C8A96E] px-4 py-3 text-[11px] font-semibold uppercase tracking-[2px] text-[#0F1F2E] transition-opacity active:opacity-90 disabled:opacity-60';

/**
 * Where a guest without a session lands.
 *
 * Two ways back in, because the link alone isn't enough. A guest who has added
 * the app to their home screen is in a separate storage bucket — the installed
 * app opens signed out, and on iOS tapping the emailed link opens Safari rather
 * than the app. Without somewhere to type the code by hand, they would be
 * permanently locked out of an icon they just installed.
 */
export default function LinkExpiredPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [message, setMessage] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [codeError, setCodeError] = useState('');

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
      setMessage(data.message ?? NEUTRAL);
    } catch {
      setMessage(NEUTRAL);
    } finally {
      setStatus('sent');
    }
  };

  const handleCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = code.trim();
    if (!otp || !email.trim() || signingIn) return;
    setSigningIn(true);
    setCodeError('');
    try {
      await completeOtpSignIn(otp, email.trim(), setUser);
      router.replace('/welcome');
    } catch (err) {
      setCodeError(
        (err as Error).message ||
          'That code didn’t work. Check the six digits, or send yourself a new one.',
      );
      setSigningIn(false);
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
          <Clock className="size-7 text-[#C8A96E]" strokeWidth={1.5} aria-hidden />
        </span>

        <div className="space-y-2">
          <h1 className="font-cormorant text-[28px] italic leading-tight text-white">
            Sign in to your stay
          </h1>
          <p className="mx-auto max-w-[300px] text-[13px] leading-relaxed text-white/65">
            {status === 'sent'
              ? 'Tap the button in the email, or enter the six-digit code it contains.'
              : 'We’ll send a secure link and a six-digit code to the email on your reservation.'}
          </p>
        </div>

        {status === 'sent' ? (
          <div className="flex w-full max-w-[300px] flex-col gap-3">
            <p className="text-[13px] leading-relaxed text-[#C8A96E]">{message}</p>

            <form onSubmit={handleCode} className="flex flex-col gap-2.5">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ''));
                  setCodeError('');
                }}
                placeholder="6-digit code"
                aria-label="Six-digit code from your email"
                className={`${inputClass} text-center tracking-[0.5em]`}
              />
              <button
                type="submit"
                disabled={code.length < 6 || signingIn}
                className={buttonClass}
              >
                {signingIn ? 'Signing you in…' : 'Sign in with code'}
              </button>
            </form>

            {codeError ? (
              <p className="text-[12px] leading-relaxed text-[#E8A08D]">
                {codeError}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setStatus('idle');
                setCode('');
                setCodeError('');
              }}
              className="text-[12px] text-white/50 underline underline-offset-2"
            >
              Use a different email
            </button>
          </div>
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
              className={inputClass}
            />
            <button
              type="submit"
              disabled={status === 'sending'}
              className={buttonClass}
            >
              {status === 'sending' ? 'Sending…' : 'Send me a link'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
