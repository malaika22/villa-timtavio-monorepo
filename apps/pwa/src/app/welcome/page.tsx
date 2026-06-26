'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useAuthStore } from '@/store/auth/useAuthStore';

export default function WelcomePage() {
  const router = useRouter();
  const firstName = useAuthStore((s) => s.user?.firstName);

  useEffect(() => {
    const t = setTimeout(() => router.replace('/'), 3200);
    return () => clearTimeout(t);
  }, [router]);

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
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Ambient glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 0.18, scale: 1 }}
        transition={{ duration: 2.4, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          width: '60vw',
          height: '60vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #C8A96E 0%, transparent 70%)',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
        }}
      />

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
        style={{
          fontFamily: 'sans-serif',
          fontSize: '9px',
          letterSpacing: '3.5px',
          textTransform: 'uppercase',
          color: '#C8A96E',
          marginBottom: '24px',
        }}
      >
        Villa TimTavio · Estate
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.9, ease: 'easeOut' }}
        style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: '40px',
          fontWeight: 400,
          color: '#F5F0E8',
          textAlign: 'center',
          lineHeight: 1.2,
          marginBottom: '16px',
        }}
      >
        {firstName ? `Welcome, ${firstName}` : 'Welcome'}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.8, ease: 'easeOut' }}
        style={{
          fontFamily: 'sans-serif',
          fontSize: '13px',
          color: '#FFFFFF60',
          textAlign: 'center',
          maxWidth: '260px',
          lineHeight: 1.7,
        }}
      >
        Your private estate experience awaits.
      </motion.p>

      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6, ease: 'easeOut' }}
        style={{
          width: '40px',
          height: '1px',
          background: '#C8A96E',
          marginTop: '32px',
          transformOrigin: 'left',
        }}
      />
    </div>
  );
}
