import 'server-only';
import { cookies } from 'next/headers';
import { createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { db } from './db';
export const cookieName = 'mk_admin';
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export function authConfigured() { return !!process.env.ADMIN_PASSWORD_HASH; }
export function verifyPassword(password: string) {
  const [salt, encoded] = (process.env.ADMIN_PASSWORD_HASH || '').split(':');
  if (!salt || !encoded || !/^[a-f0-9]{128}$/.test(encoded)) return false;
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(encoded, 'hex'));
}
export async function authenticated() {
  if (!authConfigured()) return false;
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || token.length > 128) return false;
  return !!db().prepare('SELECT 1 FROM sessions WHERE token_hash = ? AND expires > ?').get(hashToken(token), Date.now());
}
