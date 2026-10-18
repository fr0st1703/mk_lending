import { ImageResponse } from 'next/og';
export const alt = 'Mihail Kozlov — автоматизация под ваши процессы';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ display: 'flex', width: '100%', height: '100%', background: '#080f11', color: '#f4f7f6', padding: 68, flexDirection: 'column', justifyContent: 'space-between', borderBottom: '8px solid #66fcf1' }}><div style={{ fontSize: 38, fontWeight: 700 }}>Mihail Kozlov</div><div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.12 }}>Автоматизация под ваши процессы</div><div style={{ fontSize: 30, color: '#66fcf1' }}>Боты · CRM · Сайты · Интеграции</div></div>, size);
}
