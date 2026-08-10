import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isValidSession, SESSION_COOKIE } from '@/lib/auth/session';

export async function GET() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const authenticated = await isValidSession(token);
  return NextResponse.json({ authenticated });
}
