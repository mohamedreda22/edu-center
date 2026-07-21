import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Home, Landmark, Users } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { roomApi } from '../services/roomApi';

import ConfirmDialog from '@/shared/components/ConfirmDialog/ConfirmDialog';
import DataTable from '@/shared/components/DataTable/DataTable';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';

const RoomsListPage = () => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [capacity, setCapacity] = useState(5);
  const [type, setType] = useState('LECTURE');
  const [equipmentInput, setEquipmentInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomApi.getAllRooms(),
  });

  const createMutation = useMutation({
    mutationFn: roomApi.createRoom,
    onSuccess: () => {
      toast.success('تم إنشاء القاعة الدراسية بنجاح');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setFormOpen(false);
      resetForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'فشل إنشاء القاعة');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => roomApi.updateRoom(id, data),
    onSuccess: () => {
      toast.success('تم تحديث القاعة الدراسية بنجاح');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setFormOpen(false);
      setEditingRoom(null);
      resetForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'فشل تحديث القاعة');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: roomApi.deleteRoom,
    onSuccess: () => {
      toast.success('تم حذف القاعة الدراسية بنجاح');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setDeleteId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'فشل حذف القاعة');
    },
  });

  const resetForm = () => {
    setName('');
    setCode('');
    setCapacity(5);
    setType('LECTURE');
    setEquipmentInput('');
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setName(room.name);
    setCode(room.code);
    setCapacity(room.capacity);
    setType(room.type);
    setEquipmentInput(room.equipment?.join(', ') || '');
    setFormOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !code || !capacity) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const payload = {
      name,
      code,
      capacity: Number(capacity),
      type,
      equipment: equipmentInput ? equipmentInput.split(',').map(s => s.trim()) : [],
    };

    if (editingRoom) {
      updateMutation.mutate({ id: editingRoom._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns = [
    {
      header: 'اسم القاعة',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-primary shrink-0" />
          <span className="font-bold text-slate-800">{row.name}</span>
        </div>
      ),
    },
    { header: 'كود القاعة', accessor: 'code' },
    {
      header: 'النوع',
      cell: (row) => {
        const labels = {
          LECTURE: 'قاعة محاضرات',
          LAB: 'مختبر / معمل',
          TUTORIAL: 'غرفة تدريس فردي',
          OFFICE: 'مكتب إداري',
          OTHER: 'أخرى',
        };
        return labels[row.type] || row.type;
      },
    },
    {
      header: 'السعة الاستيعابية',
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-600">
          <Users className="h-3.5 w-3.5 text-secondary" />
          <span>{row.capacity} طلاب</span>
        </div>
      ),
    },
    {
      header: 'التجهيزات والموارد',
      cell: (row) => {
        const equips = row.equipment || [];
        if (equips.length === 0) {
          return <span className="text-muted-foreground text-[10px]">— لا توجد تجهيزات مخصصة —</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 text-[10px]">
            {equips.map((e, idx) => (
              <span key={idx} className="bg-slate-100 border text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                {e}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: 'الحالة',
      cell: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
            row.status === 'ACTIVE'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {row.status === 'ACTIVE' ? 'نشطة وصالحة' : 'معطلة'}
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
      <PageHeader title="إدارة القاعات والغرف المادية" description="إدارة الغرف المخصصة للدراسة وربطها بالجدول لتفادي أي تداخل مكاني">
        <Button
          onClick={() => {
            setEditingRoom(null);
            resetForm();
            setFormOpen(true);
          }}
          className="gap-2 rounded-xl"
        >
          <Plus className="h-4 w-4" />
          إضافة قاعة دراسية
        </Button>
      </PageHeader>

      <div className="bg-card p-5 border border-slate-200 rounded-2xl shadow-lg">
        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
        />
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md text-right rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-primary">
              {editingRoom ? 'تعديل بيانات القاعة الدراسية' : 'إضافة قاعة دراسية جديدة'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 my-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-black">اسم القاعة:</Label>
              <Input
                id="name"
                placeholder="مثال: قاعة النخبة أ1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl font-bold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-black">كود القاعة (Code):</Label>
              <Input
                id="code"
                placeholder="مثال: HALL_A1"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="rounded-xl font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="capacity" className="text-xs font-black">السعة (عدد الطلاب):</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="rounded-xl font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="type" className="text-xs font-black">نوع القاعة:</Label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="flex h-9 w-full rounded-xl border border-input bg-white px-3 py-1 text-sm font-bold shadow-sm"
                >
                  <option value="LECTURE">قاعة محاضرات (Lecture)</option>
                  <option value="LAB">مختبر / معمل (Lab)</option>
                  <option value="TUTORIAL">غرفة تدريس فردي (Tutorial)</option>
                  <option value="OFFICE">مكتب إداري (Office)</option>
                  <option value="OTHER">أخرى (Other)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="equipment" className="text-xs font-black">التجهيزات والموارد (مفصولة بفواصل):</Label>
              <Input
                id="equipment"
                placeholder="مثال: Projector, Smart TV, Whiteboard"
                value={equipmentInput}
                onChange={(e) => setEquipmentInput(e.target.value)}
                className="rounded-xl font-bold"
              />
            </div>

            <DialogFooter className="gap-2 sm:justify-start flex-row-reverse border-t pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormOpen(false)}
                className="rounded-xl font-bold text-xs"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="rounded-xl font-black bg-primary hover:bg-primary/90 text-white text-xs"
              >
                {createMutation.isPending || updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ البيانات'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
        title="حذف القاعة الدراسية"
        description="هل أنت متأكد من حذف هذه القاعة؟ لن يتم حذفها إذا كانت مرتبطة بحصص دراسية مستقبلية مجدولة."
      />
    </div>
  );
};

export default RoomsListPage;
