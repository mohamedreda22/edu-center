import {
  Users,
  DollarSign,
  Calendar as CalendarIcon,
  Plus,
} from 'lucide-react';
import React, { useState } from 'react';

import ConfirmDialog from '@/shared/components/ConfirmDialog/ConfirmDialog';
import DataTable from '@/shared/components/DataTable/DataTable';
import EmptyState from '@/shared/components/EmptyState/EmptyState';
import ErrorState from '@/shared/components/ErrorState/ErrorState';
import FormDialog from '@/shared/components/FormDialog/FormDialog';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import SearchFilterBar from '@/shared/components/SearchFilterBar/SearchFilterBar';
import StatCard from '@/shared/components/StatCard/StatCard';
import StatusBadge from '@/shared/components/StatusBadge/StatusBadge';
import { Button } from '@/shared/components/ui/button';

const StyleguidePage = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const columns = [
    { header: 'الاسم', accessor: 'name' },
    {
      header: 'الحالة',
      cell: (row) => <StatusBadge status={row.status} domain="student" />,
    },
    { header: 'التاريخ', accessor: 'date' },
    {
      header: 'الإجراءات',
      cell: () => (
        <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)}>
          حذف
        </Button>
      ),
    },
  ];

  const data = [
    { name: 'أحمد علي', status: 'ACTIVE', date: '2023-10-01' },
    { name: 'سارة محمد', status: 'INACTIVE', date: '2023-10-05' },
    { name: 'خالد عمر', status: 'WITHDRAWN', date: '2023-09-20' },
  ];

  return (
    <div className="space-y-12 pb-20">
      <PageHeader
        title="دليل المكونات"
        description="استعراض لجميع المكونات المشتركة في نظام Edu-Core"
      >
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة جديد
        </Button>
      </PageHeader>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">
          بطاقات الإحصائيات (StatCard)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="إجمالي الطلاب"
            value="1,284"
            icon={Users}
            trend="up"
            trendValue="+12% من الشهر الماضي"
          />
          <StatCard
            label="الإيرادات"
            value="KD 4,520"
            icon={DollarSign}
            trend="down"
            trendValue="-3% من الشهر الماضي"
          />
          <StatCard label="الحصص اليومية" value="42" icon={CalendarIcon} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">
          شارات الحالة (StatusBadge)
        </h2>
        <div className="flex flex-wrap gap-4 p-4 border rounded-lg">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Student</p>
            <div className="flex gap-2">
              <StatusBadge status="ACTIVE" domain="student" />
              <StatusBadge status="INACTIVE" domain="student" />
              <StatusBadge status="WITHDRAWN" domain="student" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Lesson</p>
            <div className="flex gap-2">
              <StatusBadge status="SCHEDULED" domain="lesson" />
              <StatusBadge status="COMPLETED" domain="lesson" />
              <StatusBadge status="CANCELLED" domain="lesson" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Payment</p>
            <div className="flex gap-2">
              <StatusBadge status="PENDING" domain="payment" />
              <StatusBadge status="PAID" domain="payment" />
              <StatusBadge status="OVERDUE" domain="payment" />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">
          جدول البيانات والبحث (DataTable & SearchBar)
        </h2>
        <div className="space-y-4">
          <SearchFilterBar onSearch={(v) => console.log('Searching for:', v)} />
          <DataTable columns={columns} data={data} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">
          حالات العرض (Empty & Error)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EmptyState
            title="لا يوجد معلمين"
            description="لم يتم إضافة أي معلمين إلى النظام حتى الآن."
            action="إضافة معلم"
          />
          <ErrorState onRetry={() => alert('Retrying...')} />
        </div>
      </section>

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title="إضافة سجل جديد"
        description="يرجى إدخال البيانات المطلوبة أدناه"
      >
        <div className="p-10 text-center border-2 border-dashed rounded-lg">
          محتوى النموذج يوضع هنا
        </div>
      </FormDialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => {
          alert('Deleted!');
          setConfirmOpen(false);
        }}
      />
    </div>
  );
};

export default StyleguidePage;
