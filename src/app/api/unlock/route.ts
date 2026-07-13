import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encryptSession, decryptSession } from '@/lib/auth';

/**
 * GET: Checks if a valid session exists.
 * This supports the client component checking auth state on mount.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('mission_control_session')?.value;
    const session = token ? decryptSession(token) : null;

    if (session && session.expiresAt && Date.now() < session.expiresAt) {
      return NextResponse.json({ authenticated: true });
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * POST: Validates the entered PIN and starts a session.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pin } = body;

    const expectedPin = process.env.MISSION_CONTROL_PIN;

    if (!expectedPin) {
      console.error("MISSION_CONTROL_PIN environment variable is not defined on the server.");
      return NextResponse.json(
        { error: 'Server authentication config is missing.' },
        { status: 500 }
      );
    }

    if (pin !== expectedPin) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      );
    }

    // Initialize 30 minutes session
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const token = encryptSession({ expiresAt: expiresAt.getTime() });

    const cookieStore = await cookies();
    cookieStore.set('mission_control_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
