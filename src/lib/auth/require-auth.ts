import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isValidSession, SESSION_COOKIE } from './session';

/** For use inside API route handlers that mutate data. Returns a 401 response if unauthenticated, else null. */
export async function requireAuthApi(): Promise<NextResponse | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const valid = await isValidSession(token);
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/** For use inside server components/pages. Returns true if the current request is authenticated. */
export async function isAuthenticated(): Promise<boolean> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return isValidSession(token);
}
