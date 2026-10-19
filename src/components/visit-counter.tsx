'use client';
import { useEffect, useRef } from 'react';
export function VisitCounter() {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void fetch('/api/views', { method: 'POST', keepalive: true }).catch(() => {});
  }, []);
  return null;
}
