'use client';

import { useRef, useState } from 'react';
import { leadSchema } from '@/lib/lead-schema';
type Field = 'full_name' | 'phone' | 'message' | 'privacy_consent';
type Errors = Partial<Record<Field, string>>;

export function LeadForm() {
  const form = useRef<HTMLFormElement>(null);
  const confirmation = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const attempt = useRef<{ payload: string; key: string } | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const data = new FormData(event.currentTarget);
    const result = leadSchema.safeParse({ full_name: data.get('full_name'), phone: data.get('phone'), message: data.get('message'), privacy_consent: data.get('privacy_consent') === 'on', website: data.get('website') || '' });
    if (!result.success) {
      const next: Errors = {};
      result.error.issues.forEach(issue => { const key = issue.path[0] as Field; if (!next[key]) next[key] = issue.message; });
      setErrors(next); setStatus('idle');
      const first = ['full_name', 'phone', 'message', 'privacy_consent'].find(key => key in next);
      if (first) (form.current?.elements.namedItem(first) as HTMLElement)?.focus();
      return;
    }
    lock.current = true; setErrors({}); setStatus('sending');
    try {
      const payload = JSON.stringify(result.data);
      if (attempt.current?.payload !== payload) attempt.current = { payload, key: crypto.randomUUID() };
      const response = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': attempt.current.key }, body: payload, signal: AbortSignal.timeout(15000) });
      const body = await response.json();
      // This contract requires server confirmation of persistence, not just HTTP 200.
      if (!response.ok || body.saved !== true || typeof body.id !== 'string' || !body.id) throw new Error('Unconfirmed submission');
      setStatus('success');
      requestAnimationFrame(() => confirmation.current?.focus());
    } catch { setStatus('error'); }
    finally { lock.current = false; }
  }
  function clear(field: Field) {
    if (errors[field]) setErrors(current => ({ ...current, [field]: undefined }));
  }
  return <div className="form-panel glass">
    {status === 'success' ? <div className="form-success" tabIndex={-1} ref={confirmation} role="status"><div className="success-symbol" aria-hidden="true">✓</div><h3>Заявка отправлена</h3><p>Спасибо! Я свяжусь с вами, чтобы обсудить задачу.</p></div> : <>
      <h3>Оставить заявку</h3>
      <form ref={form} noValidate onSubmit={submit} aria-busy={status === 'sending'}>
        <div className="form-top-row">
          <div className="field"><label htmlFor="full_name">ФИО <span aria-hidden="true">*</span></label><input id="full_name" name="full_name" autoComplete="name" placeholder="Как к вам обращаться" required minLength={2} maxLength={120} aria-invalid={!!errors.full_name} aria-describedby={errors.full_name ? 'full_name-error' : undefined} onChange={() => clear('full_name')} />{errors.full_name ? <p className="field-error" id="full_name-error">{errors.full_name}</p> : null}</div>
          <div className="field"><label htmlFor="phone">Телефон <span aria-hidden="true">*</span></label><input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="Код страны и номер" required maxLength={40} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'phone-error' : undefined} onChange={() => clear('phone')} />{errors.phone ? <p className="field-error" id="phone-error">{errors.phone}</p> : null}</div>
        </div>
        <div className="field message-field"><label htmlFor="message">Описание задачи <span aria-hidden="true">*</span></label><textarea id="message" name="message" placeholder="Что нужно автоматизировать?" required minLength={10} maxLength={2000} aria-invalid={!!errors.message} aria-describedby={`message-hint${errors.message ? ' message-error' : ''}`} onChange={() => clear('message')} /><p className="field-hint" id="message-hint">Опишите задачу своими словами.</p>{errors.message ? <p className="field-error" id="message-error">{errors.message}</p> : null}</div>
        <div className="consent"><label><input type="checkbox" name="privacy_consent" required aria-invalid={!!errors.privacy_consent} aria-describedby={errors.privacy_consent ? 'privacy_consent-error' : undefined} onChange={() => clear('privacy_consent')} /><span>Даю согласие на обработку персональных данных</span></label><a href="/consent" target="_blank" rel="noopener">Текст согласия<span className="sr-only"> (в новой вкладке)</span></a><a href="/privacy" target="_blank" rel="noopener">Политика конфиденциальности<span className="sr-only"> (в новой вкладке)</span></a>{errors.privacy_consent ? <p className="field-error" id="privacy_consent-error">{errors.privacy_consent}</p> : null}</div>
        <div className="honeypot" aria-hidden="true"><label htmlFor="website">Ваш сайт</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
        <div aria-live="polite" aria-atomic="true">{status === 'error' ? <p className="submit-error" role="alert">Не удалось отправить заявку. Данные сохранены в форме. Попробуйте ещё раз.</p> : null}{status === 'sending' ? <span className="sr-only">Отправляем заявку…</span> : null}</div>
        <button className="button button-primary submit-button" disabled={status === 'sending'} type="submit">{status === 'sending' ? 'Отправляем…' : 'Отправить заявку'}</button>
        <noscript><p>Для отправки формы включите JavaScript или свяжитесь со мной по контактам ниже.</p></noscript>
      </form>
    </>}
  </div>;
}
