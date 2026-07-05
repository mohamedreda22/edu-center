import React from 'react';

import { cn } from '../../utils';
import { Badge } from '../ui/badge';

const domainConfig = {
  student: {
    ACTIVE:
      'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    INACTIVE:
      'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
    WITHDRAWN:
      'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400',
  },
  lesson: {
    SCHEDULED:
      'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    COMPLETED:
      'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    CANCELLED:
      'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400',
    NO_SHOW:
      'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400',
  },
  payment: {
    PENDING:
      'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
    PARTIALLY_PAID:
      'bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
    PAID: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    OVERDUE:
      'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400',
    CANCELLED:
      'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400',
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
    domainConfig[domain]?.[status] || 'bg-gray-100 text-gray-800';
  const label = labels[status] || status;

  return (
    <Badge
      className={cn(
        'font-medium px-2.5 py-0.5 rounded-full border-none shadow-none',
        variantClass,
        className
      )}
    >
      {label}
    </Badge>
  );
};

export default StatusBadge;
