import {
  LayoutDashboard,
  Users,
  UserSquare2,
  Calendar,
  CreditCard,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import React from 'react';
import { NavLink } from 'react-router-dom';

import { useAuth } from '../../features/auth/AuthContext';
import { cn } from '../../shared/utils';

const menuItems = [
  {
    icon: LayoutDashboard,
    label: 'لوحة التحكم',
    path: '/',
    roles: ['ADMIN', 'RECEPTIONIST', 'ACCOUNTANT'],
  },
  {
    icon: Users,
    label: 'الطلاب',
    path: '/students',
    roles: ['ADMIN', 'RECEPTIONIST'],
  },
  { icon: UserSquare2, label: 'المعلمون', path: '/teachers', roles: ['ADMIN'] },
  {
    icon: Calendar,
    label: 'الجدول الدراسي',
    path: '/scheduling',
    roles: ['ADMIN', 'RECEPTIONIST', 'TEACHER'],
  },
  {
    icon: CreditCard,
    label: 'المدفوعات',
    path: '/payments',
    roles: ['ADMIN', 'ACCOUNTANT'],
  },
  {
    icon: Wallet,
    label: 'الرواتب',
    path: '/payroll',
    roles: ['ADMIN', 'ACCOUNTANT'],
  },
  {
    icon: BarChart3,
    label: 'التقارير',
    path: '/reports',
    roles: ['ADMIN', 'ACCOUNTANT'],
  },
  { icon: Settings, label: 'الإعدادات', path: '/settings', roles: ['ADMIN'] },
];

const Sidebar = () => {
  const { user, logout } = useAuth();

  const filteredItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <aside
      className="w-64 bg-card border-l flex flex-col h-screen sticky top-0"
      dir="rtl"
    >
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-primary">Edu-Core</h1>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t space-y-2">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs uppercase">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.role}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
