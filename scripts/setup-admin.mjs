import { randomBytes, scryptSync } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const path = '.env.local';
let env = existsSync(path) ? readFileSync(path, 'utf8') : '';
if (/^ADMIN_PASSWORD_HASH=.+/m.test(env)) {
  console.error('Администратор уже настроен. Для смены пароля выполните npm run admin:password.'); process.exit(1);
}
const password = randomBytes(18).toString('base64url');
const salt = randomBytes(16).toString('hex');
function set(key, value) { const pattern = new RegExp(`^${key}=.*$`, 'm'); env = pattern.test(env) ? env.replace(pattern, `${key}=${value}`) : `${env.trimEnd()}\n${key}=${value}\n`; }
set('ADMIN_PASSWORD_HASH', `${salt}:${scryptSync(password, salt, 64).toString('hex')}`);
if (!/^APP_ORIGIN=.+/m.test(env)) set('APP_ORIGIN', 'http://127.0.0.1:3000');
if (!/^DATABASE_PATH=.+/m.test(env)) set('DATABASE_PATH', 'data/landing.sqlite');
if (!/^LEADS_ENABLED=.+/m.test(env)) set('LEADS_ENABLED', 'true');
writeFileSync(path, env.trimStart(), { mode: 0o600 });
mkdirSync('data', { recursive: true, mode: 0o700 });
writeFileSync('data/admin-access.txt', `Локальная админ-панель: http://127.0.0.1:3000/admin\nПароль: ${password}\n\nПеренесите пароль в менеджер паролей и удалите этот файл.\n`, { mode: 0o600 });
console.log('Готово. Пароль записан в data/admin-access.txt (не попадает в Git). Перезапустите приложение.');
