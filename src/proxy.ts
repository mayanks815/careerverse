import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decryptSession } from './lib/auth';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all `/mission-control/*` routes
  if (pathname.startsWith('/mission-control/')) {
    const sessionCookie = request.cookies.get('mission_control_session')?.value;
    const session = sessionCookie ? decryptSession(sessionCookie) : null;

    // Redirect if session is missing, invalid, or expired
    if (!session || !session.expiresAt || Date.now() > session.expiresAt) {
      const redirectUrl = new URL('/mission-control', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/mission-control/:path*'],
};
