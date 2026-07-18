import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import StudentFormDialog from '../components/StudentFormDialog';
import { studentApi } from '../services/studentApi';

import ConfirmDialog from '@/shared/components/ConfirmDialog/ConfirmDialog';
import DataTable from '@/shared/components/DataTable/DataTable';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import SearchFilterBar from '@/shared/components/SearchFilterBar/SearchFilterBar';
import StatusBadge from '@/shared/components/StatusBadge/StatusBadge';
import { Button } from '@/shared/components/ui/button';
import { formatMoney } from '@/shared/utils/money';

const StudentsListPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['students', { search }],
    queryFn: () => studentApi.getAllStudents({ search }),
  });

  const createMutation = useMutation({
    mutationFn: studentApi.createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      setFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => studentApi.updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      setFormOpen(false);
      setEditingStudent(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: studentApi.deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      setDeleteId(null);
    },
  });

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormOpen(true);
  };

  const handleSubmit = (formData) => {
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const columns = [
    {
      header: 'الكود',
      cell: (row) => (
        <Link to={`/students/${row._id}`} className="text-primary hover:underline font-semibold">
          {row.studentCode}
        </Link>
      ),
    },
    { header: 'ولي الأمر', accessor: 'parentName' },
    { header: 'المرحلة', accessor: 'grade' },
    { header: 'الساعات الأسبوعية', accessor: 'weeklyHours' },
    { header: 'المتبقي (ساعات)', accessor: 'remainingHours' },
    {
      header: 'المتبقي (دينار)',
      cell: (row) => formatMoney(row.remainingAmount || 0),
    },
    {
      header: 'حالة السداد',
      cell: (row) => (
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          row.paymentStatus === 'Fully Paid' ? 'bg-green-100 text-green-800' :
          row.paymentStatus === 'Partially Paid' ? 'bg-amber-100 text-amber-800' :
          row.paymentStatus === 'No Dues' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
        }`}>
          {row.paymentStatus}
        </span>
      ),
    },
    {
      header: 'تنبيه الرصيد',
      cell: (row) => (
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          row.balanceAlert === 'OK' ? 'bg-green-100 text-green-800' :
          row.balanceAlert === 'Hours Exceeded' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
        }`}>
          {row.balanceAlert}
        </span>
      ),
    },
    {
      header: 'إجراءات',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild title="عرض التفاصيل">
            <Link to={`/students/${row._id}`}>
              <BookOpen className="h-4 w-4 text-primary" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row)} title="تعديل">
            <Edit className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteId(row._id)}
            title="حذف"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="الطلاب" description="إدارة سجلات الطلاب والاشتراكات">
        <Button
          onClick={() => {
            setEditingStudent(null);
            setFormOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          إضافة طالب
        </Button>
      </PageHeader>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SearchFilterBar
            onSearch={setSearch}
            placeholder="بحث بالاسم، الهاتف أو المنطقة..."
          />
          <div className="flex gap-2">{/* Filters could go here */}</div>
        </div>

        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
        />
      </div>

      <StudentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        initialData={editingStudent}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
        title="حذف ملف طالب"
        description="هل أنت متأكد من حذف ملف هذا الطالب؟ سيتم أرشفة السجل ولن يظهر في القوائم النشطة."
      />
    </div>
  );
};

export default StudentsListPage;
