import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const NEXT_PARAM_PATTERN = /^\/shared\/[a-zA-Z0-9_-]+$/;

function validateNext(value: string | null): string {
  if (value && NEXT_PARAM_PATTERN.test(value)) {
    return value;
  }
  return '/';
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = validateNext(searchParams.get('next'));

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  const resolvedOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${resolvedOrigin}${next}`);
    }
  }

  return NextResponse.redirect(`${resolvedOrigin}/auth/signin?error=callback_failed`);
}
