import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { activityLogApi } from '../services/activityLogApi';

import DataTable from '@/shared/components/DataTable/DataTable';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import { formatDate } from '@/shared/utils/date';

const ActivityLogPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: () => activityLogApi.getLogs(),
  });

  const columns = [
    {
      header: 'المستخدم',
      cell: (row) => `${row.userId?.firstName} ${row.userId?.lastName}`,
    },
    { header: 'الإجراء', accessor: 'action' },
    { header: 'النوع', accessor: 'entityType' },
    {
      header: 'التاريخ',
      cell: (row) => formatDate(row.createdAt, 'yyyy/MM/dd HH:mm'),
    },
    { header: 'IP', accessor: 'ipAddress' },
  ];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <PageHeader
        title="سجل النشاطات"
        description="تتبع جميع العمليات التي تمت في النظام"
      />

      <div className="bg-card p-4 border rounded-xl">
        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ActivityLogPage;
