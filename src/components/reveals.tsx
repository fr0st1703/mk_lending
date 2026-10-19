'use client';
import { useEffect } from 'react';
export function Reveals() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>('.hero-copy');
    let disposed = false, fontsReady = false, frame = 0;
    const startHero = () => {
      if (disposed || !fontsReady || document.hidden || !hero || hero.dataset.entrance === 'ready') return;
      frame = requestAnimationFrame(() => { if (!disposed) hero.dataset.entrance = 'ready'; });
    };
    void document.fonts.ready.then(() => { fontsReady = true; startHero(); });
    document.addEventListener('visibilitychange', startHero);
    const cleanupHero = () => { disposed = true; cancelAnimationFrame(frame); solutionObserver?.disconnect(); document.removeEventListener('visibilitychange', startHero); };
    const solutions = document.querySelectorAll<HTMLElement>('[data-task-solution]');
    const solutionObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).dataset.entered = 'true';
        solutionObserver?.unobserve(entry.target);
      });
    }, { threshold: .65, rootMargin: '0px 0px -6% 0px' }) : null;
    solutions.forEach(solution => {
      if (solutionObserver) solutionObserver.observe(solution);
      else solution.dataset.entered = 'true';
    });
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
    if (reduced.matches || !('IntersectionObserver' in window)) return cleanupHero;
    items.forEach(item => { if (item.getBoundingClientRect().top > innerHeight) item.classList.add('reveal-pending'); });
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.remove('reveal-pending'); observer.unobserve(entry.target); } });
    }, { threshold: 0.08 });
    items.forEach(item => observer.observe(item));
    const showAll = () => { if (reduced.matches) items.forEach(item => item.classList.remove('reveal-pending')); };
    reduced.addEventListener('change', showAll);
    return () => { cleanupHero(); observer.disconnect(); reduced.removeEventListener('change', showAll); items.forEach(item => item.classList.remove('reveal-pending')); };
  }, []);
  return null;
}
