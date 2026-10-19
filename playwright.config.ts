import { defineConfig } from '@playwright/test';
import { scryptSync } from 'node:crypto';
import { resolve } from 'node:path';
const testDatabase = process.env.TEST_DATABASE_PATH || resolve(`data/test-e2e-${Date.now()}.sqlite`);
process.env.TEST_DATABASE_PATH = testDatabase;
export default defineConfig({
  testDir: './tests', fullyParallel: false, workers: 1,
  timeout: 45000, reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:3100', headless: true, trace: 'retain-on-failure' },
  webServer: { command: 'npm run start -- --port 3100', url: 'http://127.0.0.1:3100', reuseExistingServer: false,
    env: { DATABASE_PATH: testDatabase, ADMIN_PASSWORD_HASH: `test-salt:${scryptSync('test-only-admin-password', 'test-salt', 64).toString('hex')}`, LEADS_ENABLED: 'true', APP_ORIGIN: 'http://127.0.0.1:3100', TRUST_PROXY: 'false' } },
});
