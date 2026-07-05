import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'معهد ألفا العالمي - Alpha International Institute',
  description: 'نظام متكامل لإدارة معهد ألفا العالمي للتدريس الخصوصي',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
