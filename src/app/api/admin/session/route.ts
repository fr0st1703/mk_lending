import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { authConfigured, cookieName, hashToken, verifyPassword } from '@/lib/server/auth';
import { cleanup, db, rateLimit } from '@/lib/server/db';
import { clientKey, HttpError, json, readJson, sameOrigin } from '@/lib/server/http';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({}, 403);
  if (!authConfigured()) return json({ error: 'Вход ещё не настроен. Выполните npm run admin:setup.' }, 503);
  try {
    cleanup();
    if (!rateLimit(`login:${clientKey(request)}`, 10, 900000)) return json({ error: 'Слишком много попыток. Повторите через 15 минут.' }, 429, { 'Retry-After': '900' });
    const body = await readJson(request, 2000);
    if (typeof body?.password !== 'string' || body.password.length > 256 || !verifyPassword(body.password)) return json({ error: 'Неверный пароль.' }, 401);
    const token = randomBytes(32).toString('hex');
    db().prepare('INSERT INTO sessions VALUES (?,?)').run(hashToken(token), Date.now() + 8 * 3600000);
    (await cookies()).set(cookieName, token, { httpOnly: true, sameSite: 'strict', secure: (process.env.APP_ORIGIN || '').startsWith('https://'), path: '/', maxAge: 8 * 3600 });
    return json({ ok: true });
  } catch (error) { return json({ error: 'Вход временно недоступен.' }, error instanceof HttpError ? error.status : 503); }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return json({}, 403);
  const jar = await cookies(); const token = jar.get(cookieName)?.value;
  if (token) db().prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
  jar.delete(cookieName); return json({ ok: true });
}
