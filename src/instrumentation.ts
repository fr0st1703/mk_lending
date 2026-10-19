export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { cleanup } = await import('@/lib/server/db');
    const run = () => { try { cleanup(); } catch { console.error('Database maintenance unavailable'); } };
    run();
    const timer = setInterval(run, 3600000); timer.unref();
  }
}
