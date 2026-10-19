import Link from 'next/link';
import { authenticated, authConfigured } from '@/lib/server/auth';
import { cleanup, db, leads, retentionCutoff } from '@/lib/server/db';
import { LeadControls, LoginForm, Logout } from '@/components/admin-controls';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const date = (value: string) => new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Moscow' }).format(new Date(value));
export default async function Admin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!await authenticated()) return <main className="admin-shell admin-login"><a href="/" className="wordmark">MK / управление</a><section className="glass"><p className="admin-eyebrow">Только для администратора</p><h1>Заявки под рукой</h1><p>Контакты клиентов, обращения и состояние сайта в одной панели.</p>{authConfigured() ? <LoginForm /> : <p className="admin-notice">Для первого входа выполните <code>npm run admin:setup</code> в папке проекта и перезапустите сервер. Данные входа появятся в файле <code>data/admin-access.txt</code>.</p>}<a href="/">← Вернуться на сайт</a></section></main>;
  cleanup();
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q.slice(0, 120) : '';
  const status = typeof params.status === 'string' && ['new', 'in_progress', 'closed'].includes(params.status) ? params.status : '';
  const page = Math.min(100000, Math.max(1, Number(params.page) || 1));
  const result = leads(q, status, Math.floor(page));
  const total = Number(db().prepare('SELECT count(*) AS n FROM leads WHERE created_at >= ?').get(retentionCutoff())?.n);
  const fresh = Number(db().prepare("SELECT count(*) AS n FROM leads WHERE status = 'new' AND created_at >= ?").get(retentionCutoff())?.n);
  const counts = [1, 7, 30].map(days => Number(db().prepare('SELECT coalesce(sum(count),0) AS n FROM views WHERE hour >= ?').get(new Date(Date.now() - days * 86400000).toISOString().slice(0, 13) + ':00:00.000Z')?.n));
  const link = (p: number) => `/admin?${new URLSearchParams({ q, status, page: String(p) })}`;
  return <main className="admin-shell">
    <header className="admin-header"><a className="wordmark" href="/">MK <span>/ управление</span></a><div><a href="/" className="admin-site-link">Открыть сайт ↗</a><Logout /></div></header>
    <div className="admin-heading"><div><p className="admin-eyebrow">Обзор лендинга</p><h1>Заявки и состояние сайта</h1><p>Обновлено {date(new Date().toISOString())} · московское время</p></div><a className="button button-primary" href="/api/admin/export">Скачать все заявки · Excel ↓</a></div>
    <section className="admin-stats" aria-label="Статистика"><div><span>Заявки в базе</span><strong>{total}</strong><small>{fresh} новых · хранение 2 месяца</small></div>{counts.map((n, i) => <div key={i}><span>Просмотры за {['24 часа', '7 дней', '30 дней'][i]}</span><strong>{n}</strong><small>Загрузки главной страницы</small></div>)}</section>
    <p className="admin-caption">Счётчик без cookies и идентификаторов посетителей. Повторные открытия учитываются; это просмотры, а не уникальные люди. Границы периодов округлены до часа.</p>
    <section className="admin-server glass" aria-labelledby="server-title"><div><p className="admin-eyebrow">Инфраструктура</p><h2 id="server-title">Состояние приложения</h2></div><dl><div><dt>Приложение</dt><dd className="admin-ok">Работает</dd></div><div><dt>База SQLite</dt><dd className="admin-ok">Доступна</dd></div><div><dt>Процесс запущен</dt><dd>{Math.floor(process.uptime() / 60)} мин назад</dd></div><div><dt>Память процесса</dt><dd>{Math.round(process.memoryUsage().rss / 1048576)} МБ</dd></div><div><dt>Домен / SSL</dt><dd>{process.env.INFRA_READY === 'true' ? 'Настроены (конфигурация)' : 'Не подключены'}</dd></div></dl><p className="admin-caption">Показатели относятся к текущему процессу Node.js. Внешний мониторинг сервера и проверка срока SSL появятся после размещения.</p></section>
    <section className="admin-inbox" aria-labelledby="leads-title"><div className="admin-inbox-heading"><h2 id="leads-title">Заявки клиентов <span>{result.total}</span></h2><a href={link(page)}>Обновить ↻</a></div><form className="admin-filters" method="get"><label><span className="sr-only">Поиск заявок</span><input name="q" defaultValue={q} placeholder="Имя, телефон или текст задачи" maxLength={120} /></label><label><span className="sr-only">Фильтр по статусу</span><select name="status" defaultValue={status}><option value="">Все статусы</option><option value="new">Новые</option><option value="in_progress">В работе</option><option value="closed">Закрытые</option></select></label><button className="button button-outline">Найти</button>{(q || status) && <Link href="/admin">Сбросить</Link>}</form>
    {result.items.length ? <div className="admin-list">{result.items.map(lead => <article className="admin-lead" key={lead.id}><div className="admin-lead-person"><time dateTime={lead.created_at}>{date(lead.created_at)}</time><h3>{lead.full_name}</h3><a href={`tel:${lead.phone}`}>{lead.phone}</a><small>Согласие: {date(lead.consent_at)}<br />Версия {lead.policy_version}</small></div><p className="admin-message">{lead.message}</p><LeadControls id={lead.id} status={lead.status} /></article>)}</div> : <div className="admin-empty"><span aria-hidden="true">↗</span><h3>{q || status ? 'Ничего не найдено' : 'Здесь появится первая заявка'}</h3><p>{q || status ? 'Измените запрос или сбросьте фильтры.' : 'После отправки формы на сайте контакты и задача клиента сохранятся в базе.'}</p></div>}
    <nav className="admin-pagination" aria-label="Страницы заявок">{page > 1 && <Link href={link(page - 1)}>← Назад</Link>}<span>Страница {page} из {Math.max(1, Math.ceil(result.total / 25))}</span>{page * 25 < result.total && <Link href={link(page + 1)}>Далее →</Link>}</nav></section>
    <footer className="admin-footer">Заявки старше двух месяцев удаляются автоматически. Выгрузки Excel содержат персональные данные — храните их с ограниченным доступом и удаляйте в тот же срок.</footer>
  </main>;
}
