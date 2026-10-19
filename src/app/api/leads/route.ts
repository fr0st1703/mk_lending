import { createHash, randomUUID } from 'node:crypto';
import { leadSchema } from '@/lib/lead-schema';
import { cleanup, db, rateLimit } from '@/lib/server/db';
import { clientKey, HttpError, json, readJson, sameOrigin } from '@/lib/server/http';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ saved: false }, 403);
  if (process.env.LEADS_ENABLED !== 'true') return json({ saved: false, code: 'LEADS_NOT_CONFIGURED' }, 503);
  const origin = new URL(process.env.APP_ORIGIN || 'http://127.0.0.1:3000');
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname) && (origin.protocol !== 'https:' || process.env.POLICY_READY !== 'true' || !process.env.OPERATOR_ADDRESS)) return json({ saved: false, code: 'PUBLIC_LAUNCH_NOT_READY' }, 503);
  try {
    cleanup();
    if (!rateLimit(`leads:${clientKey(request)}`, 30, 600000)) return json({ saved: false, code: 'RATE_LIMIT' }, 429, { 'Retry-After': '600' });
    const result = leadSchema.safeParse(await readJson(request));
    if (!result.success) return json({ saved: false, code: 'INVALID_FIELDS' }, 422);
    const key = request.headers.get('idempotency-key');
    if (!key || !/^[a-f0-9-]{36}$/i.test(key)) return json({ saved: false, code: 'INVALID_KEY' }, 400);
    const payloadHash = createHash('sha256').update(JSON.stringify(result.data)).digest('hex');
    const now = new Date().toISOString(); const id = randomUUID();
    db().prepare(`INSERT INTO leads (id,full_name,phone,message,consent_at,created_at,policy_version,idempotency_key,payload_hash)
      VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(idempotency_key) DO NOTHING`).run(id, result.data.full_name, result.data.phone, result.data.message, now, now, '2026-10-18', key, payloadHash);
    const saved = db().prepare('SELECT id,payload_hash FROM leads WHERE idempotency_key = ?').get(key);
    if (saved?.payload_hash !== payloadHash) return json({ saved: false, code: 'KEY_CONFLICT' }, 409);
    return json({ saved: true, id: saved.id }, saved.id === id ? 201 : 200);
  } catch (error) { return json({ saved: false }, error instanceof HttpError ? error.status : 503); }
}
