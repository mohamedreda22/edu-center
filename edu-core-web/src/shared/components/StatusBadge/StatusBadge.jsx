import React from 'react';

import { cn } from '../../utils';
import { Badge } from '../ui/badge';

const domainConfig = {
  student: {
    ACTIVE:
      'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100',
    INACTIVE:
      'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100',
    WITHDRAWN: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
  },
  lesson: {
    SCHEDULED:
      'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100',
    COMPLETED:
      'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100',
    CANCELLED: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
    NO_SHOW:
      'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100',
  },
  payment: {
    PENDING:
      'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100',
    PARTIALLY_PAID:
      'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100',
    PAID: 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100',
    OVERDUE: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
    CANCELLED:
      'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100',
  },
  registration: {
    ACTIVE:
      'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100',
    COMPLETED:
      'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100',
    CANCELLED: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
  },
};

const labels = {
  ACTIVE: 'نشط',
  INACTIVE: 'غير نشط',
  WITHDRAWN: 'منسحب',
  SCHEDULED: 'مجدول',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
  NO_SHOW: 'عدم حضور',
  PENDING: 'قيد الانتظار',
  PARTIALLY_PAID: 'مدفوع جزئياً',
  PAID: 'مدفوع',
  OVERDUE: 'متأخر',
};

const StatusBadge = ({ status, domain, className }) => {
  const variantClass =
    domainConfig[domain]?.[status] ||
    'bg-gray-100 text-gray-800 border-gray-200';
  const label = labels[status] || status;

  return (
    <Badge
      className={cn(
        'font-bold px-3 py-1 rounded-lg shadow-sm transition-all duration-200',
        variantClass,
        className
      )}
    >
      {label}
    </Badge>
  );
};

export default StatusBadge;
