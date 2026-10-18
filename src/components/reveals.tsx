'use client';
import { useEffect } from 'react';
export function Reveals() {
  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
    if (reduced.matches || !('IntersectionObserver' in window)) return;
    items.forEach(item => { if (item.getBoundingClientRect().top > innerHeight) item.classList.add('reveal-pending'); });
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.remove('reveal-pending'); observer.unobserve(entry.target); } });
    }, { threshold: 0.08 });
    items.forEach(item => observer.observe(item));
    const showAll = () => { if (reduced.matches) items.forEach(item => item.classList.remove('reveal-pending')); };
    reduced.addEventListener('change', showAll);
    return () => { observer.disconnect(); reduced.removeEventListener('change', showAll); items.forEach(item => item.classList.remove('reveal-pending')); };
  }, []);
  return null;
}
