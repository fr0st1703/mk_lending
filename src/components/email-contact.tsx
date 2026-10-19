'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

const email = 'm.kozlov76@yandex.ru';
const mailto = `mailto:${email}`;
const webmail = `https://mail.yandex.ru/compose?mailto=${encodeURIComponent(mailto)}`;

export function EmailContact() {
  const dialog = useRef<HTMLDialogElement>(null);
  const address = useRef<HTMLInputElement>(null);
  const pressedOutside = useRef(false);
  function outside(event: { clientX: number; clientY: number }) {
    const bounds = dialog.current?.getBoundingClientRect();
    return !!bounds && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom);
  }
  const [status, setStatus] = useState('');
  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setStatus('Адрес скопирован');
    } catch {
      address.current?.focus(); address.current?.select();
      setStatus('Скопируйте выделенный адрес');
    }
  }
  return <>
    <a className="contact-email" href={webmail} target="_blank" rel="noopener noreferrer" aria-label={`Написать на ${email}`} title="Электронная почта" aria-haspopup="dialog" onClick={event => { event.preventDefault(); setStatus(''); dialog.current?.showModal(); }}><Image src="/assets/icons/email.webp" width={36} height={36} alt="" /></a>
    <dialog ref={dialog} className="email-dialog" aria-labelledby="email-dialog-title" onCancel={event => event.preventDefault()} onPointerDown={event => { pressedOutside.current = outside(event); }} onPointerCancel={() => { pressedOutside.current = false; }} onClick={event => { const shouldClose = pressedOutside.current && outside(event); pressedOutside.current = false; if (shouldClose) dialog.current?.close(); }}>
      <div className="email-dialog-heading"><h2 id="email-dialog-title">Связаться по почте</h2></div>
      <input className="email-address" ref={address} autoFocus aria-label="Адрес электронной почты" value={email} readOnly />
      <div className="email-actions">
        <a className="email-action" href={mailto}>В почтовом приложении</a>
        <a className="email-action" href={webmail} target="_blank" rel="noopener noreferrer">В Яндекс Почте<span className="sr-only"> (в новой вкладке)</span></a>
        <button className="email-action" type="button" onClick={copy}>Скопировать адрес</button>
      </div>
      <p className="email-copy-status" role="status" aria-live="polite">{status}</p>
    </dialog>
  </>;
}
