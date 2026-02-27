'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Alert, Button, Card, Input, PageHeader } from '@/components/ui';

const NEXT_PARAM_PATTERN = /^\/shared\/[a-zA-Z0-9_-]+$/;

function validateNext(value: string | null): string | null {
  if (value && NEXT_PARAM_PATTERN.test(value)) {
    return value;
  }
  return null;
}

function SignInForm() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');
  const router = useRouter();

  const nextParam = validateNext(searchParams.get('next'));

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

    const callbackUrl = nextParam
      ? `${origin}/auth/callback?next=${encodeURIComponent(nextParam)}`
      : `${origin}/auth/callback`;

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl,
      },
    });

    if (authError) {
      setLoading(false);
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

    if (otpError) {
      setVerifying(false);
      setVerifyError(otpError.message);
      return;
    }

    router.push(nextParam ?? '/');
  };

  if (submitted) {
    return (
      <>
        <Card data-testid="signin-success">
          <h1 className="mb-2 text-2xl font-display font-normal text-foreground">
            Check your email
          </h1>
          <p className="mb-4 text-base text-muted-foreground">
            We sent a code to <strong>{email}</strong>. Enter the 6-digit code
            from the email to sign in.
          </p>
          <p className="mb-4 text-sm text-muted-foreground">
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

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setOtp('');
              setVerifyError(null);
            }}
            data-testid="resend-btn"
            className="text-sm text-primary bg-transparent border-none cursor-pointer"
          >
            Resend code
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-display font-normal text-foreground">
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

    </>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background" data-testid="signin-page">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <span>Sign In</span>
          </div>
        }
        backHref="/"
        sticky
      />
      <main
        id="main-content"
        className="max-w-md mx-auto px-4 py-6 pb-6 space-y-6"
      >
        <Suspense>
          <SignInForm />
        </Suspense>
      </main>
    </div>
  );
}
