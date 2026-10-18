'use client';
import { useEffect, useRef } from 'react';

type Kind = 'bots' | 'crm' | 'websites' | 'automation' | 'contact' | `process-${number}`;

export function ScientificArtwork({ kind, className = '' }: { kind: Kind; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const load = () => {
      node.style.backgroundImage = `url('/assets/generated/${kind}-science-v2.webp')`;
      node.dataset.artReady = 'true';
    };
    if (!('IntersectionObserver' in window)) { load(); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { load(); observer.disconnect(); }
    }, { rootMargin: '400px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [kind]);
  return <div className={`scientific-art ${className}`} ref={ref} data-art-kind={kind} aria-hidden="true" />;
}
