'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export function LoginForm() {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const password = new FormData(event.currentTarget).get('password');
    try {
      const response = await fetch('/api/admin/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      if (!response.ok) { const body = await response.json(); throw new Error(body.error || 'Не удалось войти.'); }
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Сервер недоступен.'); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="admin-login-form"><label htmlFor="admin-password">Пароль администратора</label><input id="admin-password" name="password" type="password" autoComplete="current-password" required maxLength={256} /><button className="button button-primary" disabled={busy}>{busy ? 'Проверяем…' : 'Войти в панель'}</button>{error && <p role="alert">{error}</p>}</form>;
}
export function Logout() {
  const router = useRouter(); const [error, setError] = useState('');
  return <><button className="button button-outline" onClick={async () => { try { const r = await fetch('/api/admin/session', { method: 'DELETE' }); if (!r.ok) throw Error(); router.refresh(); } catch { setError('Не удалось выйти. Повторите попытку.'); } }}>Выйти</button>{error && <p role="alert">{error}</p>}</>;
}
export function LeadControls({ id, status }: { id: string; status: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [confirm, setConfirm] = useState(false);
  async function mutate(method: string, next?: string) {
    setBusy(true); setError('');
    try {
      const r = await fetch(`/api/admin/leads/${id}`, { method, headers: { 'Content-Type': 'application/json' }, ...(next ? { body: JSON.stringify({ status: next }) } : {}) });
      if (!r.ok) throw Error(); router.refresh();
    } catch { setError('Изменение не сохранено. Повторите попытку.'); } finally { setBusy(false); }
  }
  return <div className="admin-lead-controls"><label className="sr-only" htmlFor={`status-${id}`}>Статус заявки</label><select id={`status-${id}`} value={status} disabled={busy} onChange={e => void mutate('PATCH', e.target.value)}><option value="new">Новая</option><option value="in_progress">В работе</option><option value="closed">Закрыта</option></select>{confirm ? <div className="delete-confirm"><span>Удалить безвозвратно?</span><button disabled={busy} onClick={() => void mutate('DELETE')}>Да, удалить</button><button onClick={() => setConfirm(false)}>Отмена</button></div> : <button className="admin-delete" disabled={busy} onClick={() => setConfirm(true)}>Удалить</button>}{error && <p role="alert">{error}</p>}</div>;
}
