'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import { questions } from '@/lib/content';
export function FAQ() {
  const [opened, setOpened] = useState<number | null>(0);
  const list = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    function measure() {
      const headings = [...el!.querySelectorAll<HTMLElement>('h4')];
      const answers = [...el!.querySelectorAll<HTMLElement>('.faq-answer')];
      const questionHeight = headings.reduce((height, heading) => height + heading.offsetHeight, 0);
      const answerHeight = Math.max(0, ...answers.map(answer => answer.offsetHeight));
      // Reserve the largest answer even when every answer is closed. Measure
      // real wrapping on this device, including font loading and text scaling.
      el!.style.height = `${Math.ceil(questionHeight + answerHeight + headings.length - 1)}px`;
    }
    measure();
    const observer = new ResizeObserver(measure);
    el.querySelectorAll('h4, .faq-answer').forEach(child => observer.observe(child));
    return () => observer.disconnect();
  }, []);
  return <div className="faq-panel glass"><h3>Частые вопросы</h3>
    <div className="faq-list" ref={list}>{questions.map((item, i) => <div className="faq-item" key={item.question}>
      <h4><button id={`question-${i}`} aria-expanded={opened === i} aria-controls={`answer-${i}`} onClick={() => setOpened(opened === i ? null : i)}>{item.question}<span className="faq-sign" aria-hidden="true">{opened === i ? '−' : '+'}</span></button></h4>
      <div className="faq-answer" id={`answer-${i}`} role="region" aria-labelledby={`question-${i}`} hidden={opened !== i}><p>{item.answer}</p></div>
    </div>)}</div>
  </div>;
}
