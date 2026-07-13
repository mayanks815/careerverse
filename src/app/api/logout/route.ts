import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST/GET: Clears the session cookie.
 */
async function handleLogout() {
  const cookieStore = await cookies();
  cookieStore.delete('mission_control_session');
  return NextResponse.json({ success: true });
}

export async function POST() {
  return handleLogout();
}

export async function GET() {
  return handleLogout();
}
