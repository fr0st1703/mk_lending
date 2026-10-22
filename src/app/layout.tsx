import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/oswald';
import '@fontsource-variable/open-sans';
import './globals.css';
import { description, siteUrl, title } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl || 'http://127.0.0.1:3000'),
  title, description,
  applicationName: 'Mihail Kozlov',
  authors: [{ name: 'Михаил Козлов' }],
  robots: { index: !!siteUrl, follow: !!siteUrl },
  openGraph: { type: 'website', locale: 'ru_RU', siteName: 'Mihail Kozlov', title, description, ...(siteUrl ? { url: siteUrl, images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Mihail Kozlov — автоматизация под ваши процессы' }] } : {}) },
  twitter: { card: 'summary_large_image', title, description, ...(siteUrl ? { images: [{ url: '/opengraph-image', alt: 'Mihail Kozlov — автоматизация под ваши процессы' }] } : {}) },
  icons: { icon: '/icon.svg' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#080f11', colorScheme: 'dark' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
