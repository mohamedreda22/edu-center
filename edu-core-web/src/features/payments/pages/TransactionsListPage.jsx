import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Clock, Landmark, Coins, FileSpreadsheet } from 'lucide-react';
import React, { useState } from 'react';

import { transactionApi } from '../services/transactionApi';
import TransactionFormDialog from '../components/TransactionFormDialog';

import { studentApi } from '@/features/students/services/studentApi';
import { teacherApi } from '@/features/teachers/services/teacherApi';
import DataTable from '@/shared/components/DataTable/DataTable';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { formatDate } from '@/shared/utils/date';
import { formatMoney } from '@/shared/utils/money';

const TransactionsListPage = () => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', { page }],
    queryFn: () => transactionApi.getTransactions({ page, limit: 15 }),
  });

  const { data: studentsRes } = useQuery({
    queryKey: ['students-list-dropdown'],
    queryFn: () => studentApi.getAllStudents({ limit: 100 }),
  });

  const { data: teachersRes } = useQuery({
    queryKey: ['teachers-list-dropdown'],
    queryFn: () => teacherApi.getAllTeachers({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: transactionApi.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      setFormOpen(false);
    },
  });

  const handleSubmit = (formData) => {
    createMutation.mutate(formData);
  };

  const columns = [
    { header: 'المعرف', accessor: 'transactionId' },
    {
      header: 'التاريخ',
      cell: (row) => formatDate(row.date, 'yyyy/MM/dd'),
    },
    {
      header: 'النوع',
      cell: (row) => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          row.type === 'STUDENT_PAYMENT' ? 'bg-green-100 text-green-800' :
          row.type === 'TEACHER_PAYMENT' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
        }`}>
          {row.type === 'STUDENT_PAYMENT' ? 'وارد (طالب)' : row.type === 'TEACHER_PAYMENT' ? 'صادر (معلم)' : 'مصروفات'}
        </span>
      ),
    },
    {
      header: 'البيان والتفاصيل',
      cell: (row) => {
        if (row.type === 'EXPENSE') return row.expenseItem;
        return row.name;
      },
    },
    {
      header: 'المبلغ',
      cell: (row) => (
        <span className={`font-bold ${row.type === 'STUDENT_PAYMENT' ? 'text-green-600' : 'text-red-600'}`}>
          {row.type === 'STUDENT_PAYMENT' ? '+' : '-'}{formatMoney(row.amount)}
        </span>
      ),
    },
    {
      header: 'طريقة الدفع',
      accessor: 'paymentMethod',
    },
    {
      header: 'المرجع',
      accessor: 'reference',
    },
    {
      header: 'الرصيد المتبقي (Live)',
      cell: (row) => (
        <span className="font-bold text-primary">
          {formatMoney(row.remainingBalance || 0)}
        </span>
      ),
    },
  ];

  // Retrieve latest transaction for current live institute balance card
  const latestTxn = data?.data?.[0];
  const liveCashBalance = latestTxn ? latestTxn.remainingBalance : 0;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <PageHeader title="دفتر الأستاذ والحركات المالية" description="المتابعة المركزية للواردات، الصادرات، ومصاريف الأكاديمية">
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          تسجيل حركة مالية
        </Button>
      </PageHeader>

      {/* Live Financial Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-r-4 border-r-primary bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
              <span>رصيد الخزينة الحالي (Live)</span>
              <Landmark className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary">{formatMoney(liveCashBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">الرصيد التراكمي المتبقي بالخزينة</p>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
              <span>إجمالي المقبوضات الحالية</span>
              <Coins className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatMoney((data?.data?.filter(t => t.type === 'STUDENT_PAYMENT').reduce((s, t) => s + t.amount, 0)) || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">المقبوضات الظاهرة بالصفحة الحالية</p>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
              <span>إجمالي المصروفات الحالية</span>
              <FileSpreadsheet className="h-4 w-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatMoney((data?.data?.filter(t => t.type !== 'STUDENT_PAYMENT').reduce((s, t) => s + t.amount, 0)) || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">المصاريف والرواتب بالصفحة الحالية</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card p-4 border rounded-xl">
        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
        />
      </div>

      <TransactionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        students={studentsRes?.data || []}
        teachers={teachersRes?.data || []}
      />
    </div>
  );
};

export default TransactionsListPage;
