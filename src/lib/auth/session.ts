import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';

export const SESSION_COOKIE = 'timeline_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function isAuthConfigured(): boolean {
  return Boolean(process.env.AUTH_USERNAME && process.env.AUTH_PASSWORD_HASH) ||
    Boolean(process.env.AUTH_USERNAME && process.env.AUTH_PASSWORD);
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const expectedUser = process.env.AUTH_USERNAME;
  if (!expectedUser || username !== expectedUser) return false;

  if (process.env.AUTH_PASSWORD_HASH) {
    return bcrypt.compare(password, process.env.AUTH_PASSWORD_HASH);
  }
  if (process.env.AUTH_PASSWORD) {
    // Plain-text fallback for simple self-hosted setups; hashing is
    // recommended (see README) but this keeps first-run setup trivial.
    return password === process.env.AUTH_PASSWORD;
  }
  return false;
}

export async function createSession(): Promise<string> {
  const token = randomBytes(32).toString('hex');
  await prisma.authSession.create({
    data: { token, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  });
  return token;
}

export async function destroySession(token: string): Promise<void> {
  await prisma.authSession.deleteMany({ where: { token } });
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const session = await prisma.authSession.findUnique({ where: { token } });
  if (!session) return false;
  if (session.expiresAt < new Date()) {
    await prisma.authSession.delete({ where: { token } }).catch(() => {});
    return false;
  }
  return true;
}

/** Convenience for use inside server components / route handlers. */
export async function getCurrentSessionToken(): Promise<string | undefined> {
  return cookies().get(SESSION_COOKIE)?.value;
}
