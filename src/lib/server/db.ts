import 'server-only';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
let connection: DatabaseSync | undefined;
export const retentionCutoff = () => {
  const d = new Date(); const day = d.getUTCDate();
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - 2);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last)); return d.toISOString();
};
export function db() {
  if (!connection) {
    const path = resolve(/* turbopackIgnore: true */ process.env.DATABASE_PATH || 'data/landing.sqlite');
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    const next = new DatabaseSync(path, { timeout: 5000 });
    next.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA secure_delete=ON;
      BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY, full_name TEXT NOT NULL CHECK(length(full_name) BETWEEN 2 AND 120),
        phone TEXT NOT NULL, message TEXT NOT NULL CHECK(length(message) BETWEEN 10 AND 2000),
        status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','in_progress','closed')),
        consent_at TEXT NOT NULL, created_at TEXT NOT NULL, policy_version TEXT NOT NULL,
        idempotency_key TEXT NOT NULL UNIQUE, payload_hash TEXT NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS leads_created ON leads(created_at);
      CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, expires INTEGER NOT NULL) STRICT;
      CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL) STRICT;
      CREATE TABLE IF NOT EXISTS views (hour TEXT PRIMARY KEY, count INTEGER NOT NULL) STRICT;
      INSERT OR IGNORE INTO schema_migrations VALUES (1); COMMIT;`);
    connection = next;
    connection.function('unicode_lower', (value) => String(value).toLocaleLowerCase('ru-RU'));
  }
  return connection;
}
export function cleanup() {
  const sql = db();
  sql.prepare('DELETE FROM leads WHERE created_at < ?').run(retentionCutoff());
  sql.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());
  sql.prepare('DELETE FROM rate_limits WHERE expires < ?').run(Date.now());
  sql.prepare('DELETE FROM views WHERE hour < ?').run(new Date(Date.now() - 31 * 86400000).toISOString());
}
export function rateLimit(key: string, limit: number, milliseconds: number) {
  const now = Date.now();
  const row = db().prepare(`INSERT INTO rate_limits VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires < ? THEN 1 ELSE count+1 END,
    expires=CASE WHEN expires < ? THEN excluded.expires ELSE expires END RETURNING count`).get(key, now + milliseconds, now, now);
  return Number(row?.count) <= limit;
}
export type Lead = { id: string; full_name: string; phone: string; message: string; status: string; consent_at: string; created_at: string; policy_version: string };
export function leads(query = '', status = '', page = 1, limit = 25) {
  const where = `created_at >= ? AND (? = '' OR instr(unicode_lower(full_name || ' ' || phone || ' ' || message), unicode_lower(?)) > 0) AND (? = '' OR status = ?)`;
  const params = [retentionCutoff(), query, query, status, status];
  const total = Number(db().prepare(`SELECT count(*) AS n FROM leads WHERE ${where}`).get(...params)?.n);
  const items = db().prepare(`SELECT id,full_name,phone,message,status,consent_at,created_at,policy_version FROM leads WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, (page - 1) * limit) as Lead[];
  return { total, items };
}
