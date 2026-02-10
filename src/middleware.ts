import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Use getUser() not getSession() — validates with the auth server.
  // If the refresh token is invalid/stale, clear auth cookies so the
  // error doesn't repeat on every subsequent request.
  const { error } = await supabase.auth.getUser();
  if (error?.code === 'refresh_token_not_found') {
    request.cookies.getAll().forEach(({ name }) => {
      if (name.startsWith('sb-')) {
        supabaseResponse.cookies.delete(name);
      }
    });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|sw\\.js|manifest\\.json).*)',
  ],
};
