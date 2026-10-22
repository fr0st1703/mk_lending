export function parseSiteUrl(value: string | undefined): string | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) throw new Error();
    return url.origin;
  } catch {
    throw new Error('NEXT_PUBLIC_SITE_URL должен быть полным адресом сайта без пути, параметров и пароля, например https://example.ru');
  }
}
export const siteUrl = parseSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
export const title = 'Автоматизация бизнеса — боты, CRM и сайты | Михаил Козлов';
export const description = 'Михаил Козлов — разработка Telegram и MAX-ботов, CRM под ваши процессы, сайтов и лендингов. Разбор задач бизнеса и проектирование автоматизации.';
