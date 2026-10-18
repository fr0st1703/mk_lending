'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { navigation } from '@/lib/content';
export function Header() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  function close() { dialog.current?.close(); }
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const onClose = () => {
      document.body.style.overflow = '';
      trigger.current?.setAttribute('aria-expanded', 'false');
      trigger.current?.focus({ preventScroll: true });
    };
    el.addEventListener('close', onClose);
    return () => { el.removeEventListener('close', onClose); document.body.style.overflow = ''; };
  }, []);
  function open() {
    dialog.current?.showModal();
    document.body.style.overflow = 'hidden';
    trigger.current?.setAttribute('aria-expanded', 'true');
  }
  function navigate(href: string) {
    close();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(href);
      target?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      target?.focus({ preventScroll: true });
    }));
  }
  return <>
    <header className="site-header container"><div className="header-surface glass">
      <a className="wordmark brand-logo" href="#home" aria-label="Mihail Kozlov — на главную"><Image src="/assets/logo.webp" width={240} height={156} alt="MK — Михаил Козлов" preload /></a>
      <nav className="desktop-nav" aria-label="Основная навигация">{navigation.map(link => <a key={link.href} href={link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noopener noreferrer" : undefined} aria-label={link.external ? `${link.label} — GitHub (в новой вкладке)` : undefined}>{link.label}</a>)}</nav>
      <a className="button button-outline header-cta" href="#contact">Обсудить задачу</a>
      <button className="menu-toggle" ref={trigger} onClick={open} aria-label="Открыть меню" aria-expanded="false" aria-controls="mobile-menu"><span /><span /><span /></button>
    </div></header>
    <dialog id="mobile-menu" className="mobile-menu glass" ref={dialog} aria-labelledby="menu-title" onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div className="menu-heading"><span className="wordmark brand-logo" id="menu-title"><Image src="/assets/logo.webp" width={240} height={156} alt="MK — Михаил Козлов" /></span><button className="close-button" onClick={close} aria-label="Закрыть меню">×</button></div>
      <nav aria-label="Мобильная навигация">{navigation.map(link => <a key={link.href} href={link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noopener noreferrer" : undefined} aria-label={link.external ? `${link.label} — GitHub (в новой вкладке)` : undefined} onClick={event => { if (link.external) { close(); return; } event.preventDefault(); navigate(link.href); }}>{link.label}</a>)}<a className="button button-primary" href="#contact" onClick={event => { event.preventDefault(); navigate('#contact'); }}>Обсудить задачу</a></nav>
    </dialog>
  </>;
}
