'use client';
import { useEffect, useState } from 'react';
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

      sessionStorage.setItem('access_token', access_token);

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
      sessionStorage.setItem('access_token', access_token);

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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#F0EDE6',
          fontFamily: 'Georgia, serif',
        }}
      >
        <p style={{ fontSize: '22px', color: '#1A1A18', marginBottom: '12px' }}>
          {errorMessage}
        </p>
        <p
          style={{
            fontSize: '15px',
            color: '#888780',
            textAlign: 'center',
            maxWidth: '320px',
            lineHeight: '1.7',
            marginBottom: '32px',
            fontFamily: 'sans-serif',
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
            padding: '14px 28px',
            border: '1px solid #1A1A18',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            color: '#1A1A18',
            textDecoration: 'none',
            letterSpacing: '0.08em',
            fontFamily: 'sans-serif',
          }}
        >
          Contact the estate
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F0EDE6',
      }}
    >
      <p
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: '16px',
          color: '#888780',
          fontStyle: 'italic',
        }}
      >
        Signing you in...
      </p>
    </div>
  );
}
