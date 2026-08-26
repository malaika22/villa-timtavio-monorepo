'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth/useAuthStore';
import { config } from '@/config';
import { decodeJwt } from '@/helpers/jwt';
import {
  applyAccessToken,
  completeOtpSignIn,
} from '@/lib/auth/completeOtpSignIn';

/**
 * The stored session, if there is one and it is still good.
 *
 * Null for no token, an undecodable one, one already past its expiry, or one
 * belonging to somebody else — every case where the right answer is to go
 * ahead and exchange the code in the URL.
 */
function liveSessionFor(email: string | null) {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem('access_token');
  if (!token) return null;

  const payload = decodeJwt(token);
  if (!payload?.exp || Date.now() / 1000 > payload.exp) return null;

  const tokenEmail = String(payload.email ?? '').toLowerCase();
  if (email && tokenEmail !== email.toLowerCase()) return null;

  return {
    auth0Id: payload.sub,
    email: payload.email || '',
    firstName: payload.given_name || '',
    roles: payload[`${config.AUTH_NAMESPACE_URL}/roles`] || [],
    bookingId: payload[`${config.AUTH_NAMESPACE_URL}/bookingId`] || '',
    guestTier: payload[`${config.AUTH_NAMESPACE_URL}/guestTier`] || 'secondary',
    accessToken: token,
    tokenExpiry: payload.exp,
  };
}

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  // Ensure the one-time exchange runs exactly once (React can re-invoke the
  // effect on re-render / fast-refresh, which would consume the OTP twice).
  const exchangedRef = useRef(false);

  const handleOtpExchange = async (otp: string, email: string) => {
    try {
      // Shared with the typed-code path on /link-expired, so a guest signing in
      // by hand lands in exactly the same state as one who tapped the link.
      await completeOtpSignIn(otp, email, setUser);
      router.replace('/welcome');
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong');
      setStatus('error');
    }
  };

  const handleExchange = async (code: string) => {
    try {
      const res = await fetch('/api/auth/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Token exchange failed');
      }

      const { access_token } = await res.json();
      applyAccessToken(access_token, setUser);

      router.replace('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong');
      setStatus('error');
    }
  };

  useEffect(() => {
    if (exchangedRef.current) return;
    exchangedRef.current = true;

    const code = searchParams.get('code');
    const otp = searchParams.get('otp');
    const email = searchParams.get('email');

    /**
     * Already signed in? Then in they go.
     *
     * This page used to exchange the code and nothing else, and the auth
     * provider deliberately stands down while it is open — so a guest with a
     * perfectly good session who tapped an old link out of their inbox was
     * shown a sign-in failure by an app they were already signed into. That is
     * the whole of the reported "we keep getting logged out": nobody was
     * logged out, they just came back through the email instead of the tab.
     *
     * The session has to be for the same person. A second guest tapping their
     * own link on a shared iPad must not land in the first one's stay, so an
     * email that doesn't match falls through to the exchange.
     */
    const existing = liveSessionFor(email);
    if (existing) {
      setUser(existing);
      router.replace('/');
      return;
    }
    const errorParam = searchParams.get('error');
    const errorDesc = searchParams.get('error_description');

    if (errorParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErrorMessage(errorDesc || 'Authentication failed');
      setStatus('error');
      return;
    }

    if (otp && email) {
      handleOtpExchange(otp, email);
      return;
    }

    if (!code) {
      setErrorMessage('Invalid or missing authentication code');
      setStatus('error');
      return;
    }

    handleExchange(code);
  }, []);

  if (status === 'error') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#f5f3f0',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '380px',
            background: '#ffffff',
            border: '1px solid #e8e6e0',
            borderRadius: '14px',
            padding: '40px 32px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(26,22,20,0.05)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/dark-logo.svg"
            alt="Villa TimTavio"
            width={128}
            style={{ display: 'block', margin: '0 auto 20px', height: 'auto' }}
          />
          <div
            style={{
              width: '40px',
              height: '2px',
              background: '#c4a882',
              margin: '0 auto 24px',
            }}
          />
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '24px',
              lineHeight: 1.25,
              color: '#0f1f2e',
              margin: '0 0 12px',
            }}
          >
            {errorMessage}
          </h1>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: '#797168',
              lineHeight: 1.7,
              margin: '0 0 28px',
            }}
          >
            Your code is tied to your stay, so it should keep working for the
            whole visit. If it doesn&rsquo;t, the estate can send you a new
            link.
          </p>
          <button
            onClick={() => {
              window.location.href = `tel:${config.ESTATE_PHONE}`;
            }}
            style={{
              width: '100%',
              padding: '14px 28px',
              background: '#0f1f2e',
              border: 'none',
              borderRadius: '10px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            Call {config.ESTATE_PHONE_DISPLAY}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        background: '#f5f3f0',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/dark-logo.svg"
        alt="Villa TimTavio"
        width={128}
        style={{ height: 'auto' }}
      />
      <p
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: '17px',
          color: '#797168',
          fontStyle: 'italic',
        }}
      >
        Signing you in…
      </p>
    </div>
  );
}
