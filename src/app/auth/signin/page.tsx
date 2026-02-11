'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Alert, Button, Card, Input, BottomNav } from '@/components/ui';

function SignInForm() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const origin = window.location.origin;

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (authError) {
      if (authError.status === 429) {
        setError('Too many requests. Please wait a moment before trying again.');
      } else {
        setError(authError.message);
      }
      return;
    }

    setSubmitted(true);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    setVerifying(true);

    const supabase = createClient();
    const { error: otpError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });

    setVerifying(false);

    if (otpError) {
      setVerifyError(otpError.message);
      return;
    }

    router.push('/');
  };

  if (submitted) {
    return (
      <>
        <Card data-testid="signin-success">
          <h1
            className="mb-2"
            style={{
              fontSize: 'var(--font-size-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
            }}
          >
            Check your email
          </h1>
          <p
            className="mb-4"
            style={{
              fontSize: 'var(--font-size-body)',
              color: 'var(--color-text-muted)',
            }}
          >
            We sent a code to <strong>{email}</strong>. Enter the 6-digit code
            from the email to sign in.
          </p>
          <p
            className="mb-4"
            style={{
              fontSize: 'var(--font-size-caption)',
              color: 'var(--color-text-muted)',
            }}
          >
            Or tap the magic link in the email if you&apos;re using a browser.
          </p>

          <form onSubmit={handleVerify} noValidate>
            <Input
              label="6-digit code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoComplete="one-time-code"
              value={otp}
              onChange={setOtp}
              placeholder="123456"
              className="mb-4"
              data-testid="otp-input"
              disabled={verifying}
            />

            {verifyError && (
              <div className="mb-4">
                <Alert variant="error">{verifyError}</Alert>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={verifying || otp.length !== 6}
              loading={verifying}
              data-testid="verify-btn"
            >
              {verifying ? 'Verifying…' : 'Verify'}
            </Button>
          </form>
        </Card>

        <BottomNav
          backHref="/"
          backLabel="Back"
          secondaryAction={{
            label: 'Resend code',
            onClick: () => {
              setSubmitted(false);
              setOtp('');
              setVerifyError(null);
            },
            testId: 'resend-btn',
          }}
        />
      </>
    );
  }

  return (
    <>
      <h1
        className="mb-6"
        style={{
          fontSize: 'var(--font-size-heading)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-text-primary)',
        }}
      >
        Sign in
      </h1>

      {urlError === 'callback_failed' && (
        <div className="mb-4" data-testid="signin-error">
          <Alert variant="error">Sign-in failed. Please try again.</Alert>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} noValidate>
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className="mb-4"
            data-testid="email-input"
          />

          {error && (
            <div className="mb-4" data-testid="signin-error">
              <Alert variant="error">{error}</Alert>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !email}
            loading={loading}
            data-testid="send-magic-link-btn"
          >
            {loading ? 'Sending…' : 'Send magic link'}
          </Button>
        </form>
      </Card>

      <BottomNav backHref="/" backLabel="Back" />
    </>
  );
}

export default function SignInPage() {
  return (
    <main
      id="main-content"
      className="min-h-screen flex flex-col items-center justify-center px-4 pb-20"
      data-testid="signin-page"
    >
      <div className="max-w-md w-full">
        <Suspense>
          <SignInForm />
        </Suspense>
      </div>
    </main>
  );
}
