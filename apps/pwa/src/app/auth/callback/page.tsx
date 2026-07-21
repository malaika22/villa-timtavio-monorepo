'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth/useAuthStore';
import { decodeJwt } from '@/helpers/jwt';
import { getNamespaceUrl } from '@/helpers/namespace';
import { API_URLS } from '@/urls';

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
      const res = await fetch('/api/auth/exchange-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, email }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Token exchange failed');
      }

      const { access_token } = await res.json();

      localStorage.setItem('access_token', access_token);

      const payload = decodeJwt(access_token);
      if (payload) {
        setUser({
          auth0Id: payload.sub,
          email: payload.email || '',
          firstName: payload.given_name || '',
          roles: payload[`${getNamespaceUrl()}/roles`] || [],
          bookingId: payload[`${getNamespaceUrl()}/bookingId`] || '',
          guestTier: payload[`${getNamespaceUrl()}/guestTier`] || 'secondary',
          accessToken: access_token,
          tokenExpiry: payload.exp,
        });

        const bookingId = payload[`${getNamespaceUrl()}/bookingId`];
        if (bookingId) {
          fetch(`${API_URLS.manifestLinkOpen}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${access_token}`,
            },
            body: JSON.stringify({ bookingId, email: payload.email }),
          }).catch(() => {});
        }
      }

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

      // Store token
      localStorage.setItem('access_token', access_token);

      // Decode and set user in store
      const payload = decodeJwt(access_token);
      if (payload) {
        setUser({
          auth0Id: payload.sub,
          email: payload.email || '',
          firstName: payload.given_name || '',
          roles: payload[`${getNamespaceUrl()}/roles`] || [],
          bookingId: payload[`${getNamespaceUrl()}/bookingId`] || '',
          guestTier: payload[`${getNamespaceUrl()}/guestTier`] || 'secondary',
          accessToken: access_token,
          tokenExpiry: payload.exp,
        });

        // Mark PWA link as opened (non-blocking)
        const bookingId = payload[`${getNamespaceUrl()}/bookingId`];
        if (bookingId) {
          fetch(`${API_URLS.manifestLinkOpen}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${access_token}`,
            },
            body: JSON.stringify({ bookingId, email: payload.email }),
          }).catch(() => {});
        }
      }

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
            For your privacy, access links expire automatically. Please contact
            the estate for a new link.
          </p>
          <button
            onClick={() => {
              window.location.href = `tel:+1234567890`;
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
            Contact the estate
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
