import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { prepareGeneratedArt } from './prepare-generated-art.mjs';
const base = 'https://api.createya.ai';
const directory = path.join(process.cwd(), 'design/generated');
const assets = path.join(process.cwd(), 'public/assets/generated');
await mkdir(directory, { recursive: true }); await mkdir(assets, { recursive: true });
const config = JSON.parse(await readFile(path.join(directory, 'illustration-prompts-v2.json'), 'utf8'));
// No credentials in arguments, source, output or persisted request records.
if (process.stdin.isTTY) process.stdin.setRawMode(true);
process.stdin.setEncoding('utf8');
console.log('Ready for Createya credential JSON on hidden stdin.');
const credential = await new Promise((resolve, reject) => {
  let input = '';
  process.stdin.on('data', function receive(chunk) {
    if (chunk.includes('\u0003')) { reject(new Error('Cancelled')); return; }
    input += chunk;
    if (!input.includes('\n') && !input.includes('\r')) return;
    process.stdin.off('data', receive); process.stdin.pause();
    if (process.stdin.isTTY) process.stdin.setRawMode(false);
    try { resolve(JSON.parse(input.trim())); input = ''; } catch { reject(new Error('Invalid credential JSON')); }
  });
});
process.env.CREATEYA_API_KEY = credential.key; delete credential.key;
async function api(url, options = {}) {
  const response = await fetch(base + url, { ...options, headers: { Authorization: `Bearer ${process.env.CREATEYA_API_KEY}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`Createya HTTP ${response.status}`);
  return response.json();
}
function imageUrls(value) {
  if (!value) return [];
  if (typeof value === 'string') return /^https:\/\//.test(value) ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(imageUrls);
  return Object.entries(value).filter(([key]) => !/webhook|request|input|prompt/.test(key)).flatMap(([, item]) => imageUrls(item));
}
async function run(job) {
  const recordPath = path.join(directory, `${job.name}-run.json`);
  let record;
  try { record = JSON.parse(await readFile(recordPath, 'utf8')); } catch {}
  if (record?.completed) { console.log(`${job.name}: already saved`); return; }
  if (!record?.runId) {
    const result = await api('/v1/run', { method: 'POST', body: JSON.stringify({ model: config.model, input: { prompt: config.common + '\n' + job.prompt, aspect_ratio: job.aspect_ratio, resolution: config.resolution } }) });
    const runId = result.run_id || result.id || result.data?.run_id || result.data?.id;
    if (!runId) throw new Error('Createya did not return a run identifier');
    record = { provider: 'Createya', model: config.model, runId, name: job.name };
    await writeFile(recordPath, JSON.stringify(record, null, 2));
    console.log(`${job.name}: generation started (${runId})`);
  }
  for (let attempt = 0; attempt < 180; attempt++) {
    const result = await api(`/v1/runs/${encodeURIComponent(record.runId)}`);
    const data = result.data || result;
    const status = data.status || result.status;
    if (['failed', 'cancelled', 'canceled', 'error'].includes(status)) throw new Error(`Generation ${status}`);
    if (['completed', 'succeeded', 'success'].includes(status)) {
      const urls = imageUrls(data.output || result.output || data.result || result.result);
      if (!urls.length) throw new Error('Completed generation has no output image');
      const response = await fetch(urls[0], { signal: AbortSignal.timeout(120000) });
      if (!response.ok) throw new Error(`Image download HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      await sharp(bytes).png().toFile(path.join(directory, `${job.name}.png`));
      await prepareGeneratedArt(job.name, bytes);
      record.completed = true; await writeFile(recordPath, JSON.stringify(record, null, 2));
      console.log(`${job.name}: saved PNG original and optimized WebP`); return;
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  throw new Error('Polling timed out; rerun to resume the existing job');
}
try {
  await api('/v1/balance'); console.log('Createya authentication validated.');
  const selected = process.argv.slice(2);
  const pending = config.jobs.filter(job => !selected.length || selected.includes(job.name));
  const results = await Promise.allSettled(Array.from({ length: 2 }, async () => { while (pending.length) await run(pending.shift()); }));
  let failed = false;
  for (const result of results) if (result.status === 'rejected') { failed = true; console.error(result.reason.message); }
  if (failed) process.exitCode = 1;
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { delete process.env.CREATEYA_API_KEY; process.stdin.destroy(); }
