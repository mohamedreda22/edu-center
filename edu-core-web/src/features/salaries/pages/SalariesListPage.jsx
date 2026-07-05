import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import DataTable from '@/shared/components/DataTable/DataTable';
import { Button } from '@/shared/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { salaryApi } from '../services/salaryApi';
import SalaryFormDialog from '../components/SalaryFormDialog';
import ConfirmDialog from '@/shared/components/ConfirmDialog/ConfirmDialog';
import { formatMoney } from '@/shared/utils/money';

const SalariesListPage = () => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['salaries'],
    queryFn: () => salaryApi.getAllSalaries(),
  });

  const createMutation = useMutation({
    mutationFn: salaryApi.createSalary,
    onSuccess: () => {
      queryClient.invalidateQueries(['salaries']);
      setFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => salaryApi.updateSalary(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['salaries']);
      setFormOpen(false);
      setEditingSalary(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: salaryApi.deleteSalary,
    onSuccess: () => {
      queryClient.invalidateQueries(['salaries']);
      setDeleteId(null);
    },
  });

  const handleEdit = (salary) => {
    setEditingSalary({
      ...salary,
      teacherId: salary.teacherId?._id || salary.teacherId,
    });
    setFormOpen(true);
  };

  const handleSubmit = (formData) => {
    if (editingSalary) {
      updateMutation.mutate({ id: editingSalary._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const columns = [
    {
      header: 'المعلم',
      cell: (row) =>
        `${row.teacherId?.userId?.firstName || ''} ${row.teacherId?.userId?.lastName || ''}`,
    },
    { header: 'الشهر/السنة', cell: (row) => `${row.month}/${row.year}` },
    { header: 'الساعات', accessor: 'hoursWorked' },
    {
      header: 'الإجمالي',
      cell: (row) => formatMoney(row.totalSalary),
    },
    {
      header: 'الحالة',
      cell: (row) => (
        <span className={row.paid ? 'text-green-600' : 'text-yellow-600'}>
          {row.paid ? 'تم الصرف' : 'قيد المعالجة'}
        </span>
      ),
    },
    {
      header: 'إجراءات',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteId(row._id)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <PageHeader
        title="رواتب الساعات"
        description="إدارة رواتب الموظفين بنظام الساعات"
      >
        <Button
          onClick={() => {
            setEditingSalary(null);
            setFormOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          إدخال راتب
        </Button>
      </PageHeader>

      <div className="bg-card p-4 border rounded-xl">
        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
        />
      </div>

      <SalaryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        initialData={editingSalary}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
        title="حذف سجل راتب"
        description="هل أنت متأكد من حذف هذا السجل؟"
      />
    </div>
  );
};

export default SalariesListPage;
