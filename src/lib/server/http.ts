import 'server-only';
import { NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';
export function json(data: unknown, status = 200, headers: Record<string, string> = {}) { return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } }); }
export function sameOrigin(request: Request) { return request.headers.get('origin') === (process.env.APP_ORIGIN || 'http://127.0.0.1:3000'); }
export async function readJson(request: Request, max = 16000) {
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') throw new HttpError(415);
  const reader = request.body?.getReader(); if (!reader) throw new HttpError(400);
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    length += value.length; if (length > max) { await reader.cancel(); throw new HttpError(413); } chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new HttpError(400); }
}
export class HttpError extends Error { constructor(public status: number) { super('Request rejected'); } }
export function clientKey(request: Request) {
  // Enable only behind a proxy that overwrites this header and blocks direct access.
  const ip = process.env.TRUST_PROXY === 'true' ? request.headers.get('x-real-ip') || 'unknown' : 'local';
  return createHmac('sha256', process.env.ADMIN_PASSWORD_HASH || 'local-rate-limit').update(ip).digest('hex');
}
