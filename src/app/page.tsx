import Image from 'next/image';
import { EmailContact } from '@/components/email-contact';
import { VisitCounter } from '@/components/visit-counter';
import { Header } from '@/components/header';
import { NetworkBackground } from '@/components/network-background';
import { FAQ } from '@/components/faq';
import { LeadForm } from '@/components/lead-form';
import { Reveals } from '@/components/reveals';
import { ScientificArtwork } from '@/components/scientific-artwork';
import { services, steps, tasks } from '@/lib/content';
import { siteUrl } from '@/lib/site';

export default function Home() {
  const structuredData = {
    '@context': 'https://schema.org', '@type': 'ProfessionalService', name: 'Михаил Козлов — автоматизация бизнеса',
    description: 'Разработка ботов, CRM, сайтов и проектирование автоматизации под процессы бизнеса.',
    ...(siteUrl ? { url: siteUrl } : {}), email: 'm.kozlov76@yandex.ru', telephone: '+79679804740',
    sameAs: ['https://t.me/up_netw0rk', 'https://www.instagram.com/guardian1703/', 'https://github.com/fr0st1703'],
    founder: { '@type': 'Person', name: 'Михаил Козлов', alternateName: 'Mihail Kozlov' },
    hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Автоматизация бизнеса', itemListElement: services.map(service => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: service.title, description: service.text } })) },
  };
  return <>
    <VisitCounter />
    <a className="skip-link" href="#main">Перейти к содержимому</a>
    <NetworkBackground />
    <Header />
    <main id="main">
      <section id="home" className="section hero" aria-labelledby="hero-title" tabIndex={-1}>
        <div className="container hero-stage">
          <div className="hero-copy glass">
            <h1 id="hero-title">Автоматизация<br className="desktop-break" /> под ваши процессы</h1>
            <p>Разрабатываю ботов, CRM и сайты.<br className="desktop-break" /> Помогаю связать инструменты и убрать ручные операции.</p>
            <a href="#contact" className="button button-primary hero-button">Обсудить задачу</a>
          </div>
          <div className="hero-portrait portrait">
            <Image src="/assets/portrait-hero-960.webp" width={960} height={1144} alt="Михаил Козлов, разработчик решений для бизнеса" sizes="(max-width: 767px) 100vw, (max-width: 1023px) 65vw, 52vw" preload quality={90} />
          </div>
        </div>
      </section>
      <section id="tasks" className="section tasks-section" aria-labelledby="tasks-title" tabIndex={-1}>
        <div className="container section-content">
          <div className="section-heading"><h2 id="tasks-title">Когда бизнесу нужна<br className="desktop-break" /> автоматизация</h2><p>Начинаем с задач, которые мешают ежедневной работе.</p></div>
          <div className="tasks-panel glass">
            <div className="tasks-labels" aria-hidden="true"><span>Знакомая ситуация</span><span>Что можно изменить</span></div>
            <dl>{tasks.map(([problem, solution], i) => <div className="task-pair" key={problem}><dt>{problem}</dt><dd className="task-solution" data-task-solution style={{ '--task-delay': `${i * 90}ms` } as React.CSSProperties}><span>{solution}</span></dd></div>)}</dl>
          </div>
        </div>
      </section>
      <section id="services" className="section services-section" aria-labelledby="services-title" tabIndex={-1}>
        <div className="container section-content">
          <div className="section-heading"><h2 id="services-title">Решения под задачи<br className="desktop-break" /> вашего бизнеса</h2><p>От отдельного инструмента до связанной системы.</p></div>
          <div className="services-grid">{services.map((service, i) => <article className={`service-card glass service-${service.image}`} data-reveal key={service.image} style={{ '--delay': `${i % 2 * 90}ms` } as React.CSSProperties}>
            <div className="service-copy"><h3>{service.title}</h3><p>{service.text}</p></div>
            <div className="service-art" aria-hidden="true"><ScientificArtwork kind={service.image} /></div>
          </article>)}</div>
        </div>
      </section>
      <section id="process" className="section process-section" aria-labelledby="process-title" tabIndex={-1}>
        <div className="container section-content">
          <div className="section-heading"><h2 id="process-title">От задачи до<br className="desktop-break" /> работающего решения</h2><p>На каждом этапе понятно, что делаем и что получаем.</p></div>
          <div className="process-panel glass">
            <ol className="process-grid">{steps.map((step, i) => <li data-reveal key={step.title} style={{ '--delay': `${i * 80}ms` } as React.CSSProperties}><div><h3>{step.title}</h3><p>{step.text}</p></div><p className="step-result">{step.result}</p></li>)}</ol>
            <div className="process-ribbon" aria-hidden="true">{steps.map((step, i) => <ScientificArtwork key={step.title} kind={`process-${i + 1}`} />)}</div>
          </div>
          <p className="process-note">Дальнейшая поддержка и развитие обсуждаются отдельно.</p>
        </div>
      </section>
      <section id="questions" className="section approach-section" aria-labelledby="approach-title" tabIndex={-1}>
        <div className="container section-content">
          <div className="section-heading"><h2 id="approach-title">Сначала разберёмся в вашей задаче</h2><p>Подбираю решение под процессы бизнеса и обсуждаю план до начала разработки.</p></div>
          <div className="approach-grid"><div className="approach-portrait portrait"><Image src="/assets/portrait-approach-960.webp" width={960} height={1153} alt="Михаил Козлов с поднятым большим пальцем" sizes="(max-width: 1023px) 360px, 42vw" /></div><FAQ /></div>
        </div>
      </section>
      <section id="contact" className="section contact-section" aria-labelledby="contact-title" tabIndex={-1}>
        <div className="container section-content">
          <div className="contact-grid">
            <div className="contact-copy"><h2 id="contact-title">Обсудим вашу задачу</h2><p>Расскажите, что хотите изменить в работе бизнеса. Я свяжусь с вами, чтобы обсудить детали.</p><ScientificArtwork className="contact-ribbon" kind="contact" /></div>
            <LeadForm />
          </div>
          <address className="contact-links" aria-label="Контакты Михаила Козлова">
            <a href="https://www.instagram.com/guardian1703/" target="_blank" rel="noopener noreferrer" aria-label="Instagram guardian1703 (в новой вкладке)" title="Instagram"><Image src="/assets/icons/instagram.webp" width={36} height={36} alt="" /></a>
            <a href="https://t.me/up_netw0rk" target="_blank" rel="noopener noreferrer" aria-label="Telegram @up_netw0rk (в новой вкладке)" title="Telegram"><Image src="/assets/icons/telegram.webp" width={36} height={36} alt="" /></a>
            <EmailContact />
          </address>
          <footer className="footer"><a href="#home">Mihail Kozlov</a><a href="/privacy" target="_blank" rel="noopener">Политика конфиденциальности</a></footer>
        </div>
      </section>
    </main>
    <Reveals />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
  </>;
}
