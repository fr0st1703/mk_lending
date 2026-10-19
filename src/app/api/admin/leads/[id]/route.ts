import { authenticated } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { HttpError, json, readJson, sameOrigin } from '@/lib/server/http';
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return json({}, 403);
  if (!await authenticated()) return json({}, 401);
  try {
    const body = await readJson(request, 1000);
    if (!['new', 'in_progress', 'closed'].includes(body?.status)) return json({}, 422);
    const { id } = await context.params;
    const result = db().prepare('UPDATE leads SET status = ? WHERE id = ?').run(body.status, id);
    return json({ ok: !!result.changes }, result.changes ? 200 : 404);
  } catch (error) { return json({}, error instanceof HttpError ? error.status : 503); }
}
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return json({}, 403);
  if (!await authenticated()) return json({}, 401);
  const { id } = await context.params;
  db().prepare('DELETE FROM leads WHERE id = ?').run(id);
  return json({ ok: true });
}
