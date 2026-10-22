import { randomBytes, scryptSync } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

// Passwords arrive through stdin, never command-line arguments or logs.
try {
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
    if (input.length > 8192) throw new Error('Слишком длинный ввод.');
  }
  const { password, confirmation } = JSON.parse(input.replace(/^\uFEFF/, ''));
  if (typeof password !== 'string' || password.length < 12 || password.length > 256) {
    throw new Error('Пароль должен содержать от 12 до 256 символов.');
  }
  if (password !== confirmation) throw new Error('Пароли не совпадают. Изменений нет.');
  if (!existsSync('.env.local')) throw new Error('Сначала выполните npm run admin:setup.');
  const env = readFileSync('.env.local', 'utf8');
  const salt = randomBytes(16).toString('hex');
  const hash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
  const pattern = /^ADMIN_PASSWORD_HASH=.*$/gm;
  const updated = pattern.test(env)
    ? env.replace(pattern, () => `ADMIN_PASSWORD_HASH=${hash}`)
    : `${env.trimEnd()}\nADMIN_PASSWORD_HASH=${hash}\n`;
  const temporary = `.env.local.password-${randomBytes(8).toString('hex')}.tmp`;
  try {
    writeFileSync(temporary, updated, { mode: 0o600, flag: 'wx' });
    const database = process.env.DATABASE_PATH || 'data/landing.sqlite';
    if (existsSync(database)) {
      const sql = new DatabaseSync(database, { timeout: 5000 });
      try {
        if (sql.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='sessions'").get()) {
          sql.exec('DELETE FROM sessions');
        }
      } finally { sql.close(); }
    }
    renameSync(temporary, '.env.local');
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
  if (existsSync('data/admin-access.txt')) unlinkSync('data/admin-access.txt');
  console.log('Пароль изменён, старые сессии завершены. Перезапустите сервер, чтобы применить новый пароль.');
} catch (error) {
  console.error(error instanceof SyntaxError ? 'Не удалось прочитать ввод пароля.' : error.message);
  process.exitCode = 1;
}
