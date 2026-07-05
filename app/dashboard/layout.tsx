'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ firstName: string; lastName: string; role: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch(() => router.push('/login'));
  }, [router]);

  const navItems = [
    { label: 'الرئيسية', href: '/dashboard' },
    { label: 'المعلمون', href: '/dashboard/teachers' },
    { label: 'الطلاب', href: '/dashboard/students' },
    { label: 'الجدول', href: '/dashboard/schedule' },
    { label: 'الحضور', href: '/dashboard/attendance' },
    { label: 'المدفوعات', href: '/dashboard/payments' },
    { label: 'الرواتب', href: '/dashboard/salaries' },
    { label: 'كشوفات الرواتب', href: '/dashboard/payroll' },
  ];

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">معهد ألفا العالمي</h2>
          <p className="text-xs text-gray-400">Alpha International Institute</p>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 rounded ${
                isActive(item.href)
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
