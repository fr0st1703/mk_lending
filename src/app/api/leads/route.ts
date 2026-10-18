import { NextResponse } from 'next/server';

// Frontend phase: no data is stored, logged or forwarded. Replace this adapter
// with validated, rate-limited persistence once storage and policy are approved.
export async function POST() {
  return NextResponse.json({ saved: false, code: 'LEADS_NOT_CONFIGURED' }, { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '3600' } });
}
