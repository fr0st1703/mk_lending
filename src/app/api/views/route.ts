import { db, rateLimit } from '@/lib/server/db';
import { clientKey, json } from '@/lib/server/http';
export async function POST(request: Request) {
  // The public preview can use a different origin from the SSH-only admin.
  const origin = process.env.VIEWS_ORIGIN || process.env.APP_ORIGIN || 'http://127.0.0.1:3000';
  if (request.headers.get('origin') !== origin) return json({}, 403);
  try {
    if (!rateLimit(`views:${clientKey(request)}`, 120, 60000)) return json({}, 429, { 'Retry-After': '60' });
    const hour = new Date().toISOString().slice(0, 13) + ':00:00.000Z';
    db().prepare('INSERT INTO views VALUES (?,1) ON CONFLICT(hour) DO UPDATE SET count=count+1').run(hour);
    return json({ ok: true });
  } catch { return json({}, 503); }
}
