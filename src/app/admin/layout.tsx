import type { Metadata } from 'next';
import './admin.css';
export const metadata: Metadata = { title: 'Панель управления — MK', robots: { index: false, follow: false }, alternates: { canonical: null } };
export default function AdminLayout({ children }: { children: React.ReactNode }) { return children; }
