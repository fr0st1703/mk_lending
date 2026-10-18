const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
export const siteUrl = raw && /^https?:\/\//.test(raw) ? new URL(raw).origin : undefined;
export const title = 'Автоматизация бизнеса — боты, CRM и сайты | Михаил Козлов';
export const description = 'Михаил Козлов — разработка Telegram и MAX-ботов, CRM под ваши процессы, сайтов и лендингов. Разбор задач бизнеса и проектирование автоматизации.';
