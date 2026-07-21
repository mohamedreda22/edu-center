import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Shield, Users, Phone, Mail, Award, CheckCircle } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { guardianApi } from '../services/guardianApi';
import { studentApi } from '../services/studentApi';

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

const GuardiansListPage = () => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Link student dialog state
  const [linkOpen, setLinkOpen] = useState(false);
  const [activeGuardianId, setActiveGuardianId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [civilId, setCivilId] = useState('');

  const { data: guardians, isLoading } = useQuery({
    queryKey: ['guardians'],
    queryFn: () => guardianApi.getAllGuardians(),
  });

  const { data: students } = useQuery({
    queryKey: ['students-unlinked'],
    queryFn: () => studentApi.getAllStudents({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: guardianApi.createGuardian,
    onSuccess: () => {
      toast.success('تم تسجيل ولي الأمر بنجاح');
      queryClient.invalidateQueries({ queryKey: ['guardians'] });
      setFormOpen(false);
      resetForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'فشل تسجيل ولي الأمر');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => guardianApi.updateGuardian(id, data),
    onSuccess: () => {
      toast.success('تم تحديث بيانات ولي الأمر بنجاح');
      queryClient.invalidateQueries({ queryKey: ['guardians'] });
      setFormOpen(false);
      setEditingGuardian(null);
      resetForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'فشل تحديث البيانات');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: guardianApi.deleteGuardian,
    onSuccess: () => {
      toast.success('تم حذف ملف ولي الأمر بنجاح');
      queryClient.invalidateQueries({ queryKey: ['guardians'] });
      setDeleteId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'فشل حذف الملف');
    },
  });

  const linkMutation = useMutation({
    mutationFn: ({ guardianId, studentId }) => guardianApi.linkStudent(guardianId, studentId),
    onSuccess: () => {
      toast.success('تم ربط الطالب بولي الأمر بنجاح');
      queryClient.invalidateQueries({ queryKey: ['guardians'] });
      setLinkOpen(false);
      setSelectedStudentId('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'فشل ربط الطالب');
    },
  });

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setWhatsapp('');
    setCivilId('');
  };

  const handleEdit = (g) => {
    setEditingGuardian(g);
    setFirstName(g.firstName);
    setLastName(g.lastName);
    setPhone(g.phone);
    setEmail(g.email || '');
    setWhatsapp(g.whatsapp || '');
    setCivilId(g.civilId || '');
    setFormOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !phone) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const payload = {
      firstName,
      lastName,
      phone,
      email,
      whatsapp,
      civilId,
    };

    if (editingGuardian) {
      updateMutation.mutate({ id: editingGuardian._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleLinkStudent = (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      toast.error('يرجى اختيار طالب لربطه');
      return;
    }
    linkMutation.mutate({ guardianId: activeGuardianId, studentId: selectedStudentId });
  };

  const columns = [
    {
      header: 'ولي الأمر',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-secondary shrink-0" />
          <span className="font-bold text-slate-800">{row.firstName} {row.lastName}</span>
        </div>
      ),
    },
    {
      header: 'معلومات الاتصال',
      cell: (row) => (
        <div className="flex flex-col gap-0.5 text-xs">
          <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-slate-400" /> {row.phone}</span>
          {row.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-slate-400" /> {row.email}</span>}
        </div>
      ),
    },
    {
      header: 'الطلاب المرتبطين والأبناء',
      cell: (row) => {
        const linked = row.students || [];
        if (linked.length === 0) {
          return <span className="text-muted-foreground text-[10px]">— لا توجد روابط —</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {linked.map((s) => (
              <span key={s._id} className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200/50 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                <Users className="h-3 w-3" />
                {s.parentName}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: 'جاهزية بوابة ولي الأمر (Portal)',
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-[11px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 font-bold">
          <CheckCircle className="h-3 w-3" />
          نشط وجاهز
        </span>
      ),
    },
    {
      header: 'إجراءات روابط وحوكمة',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveGuardianId(row._id);
              setLinkOpen(true);
            }}
            className="text-xs h-8 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-bold"
          >
            ربط طالب جديد
          </Button>
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
      <PageHeader title="بوابة وإدارة أولياء الأمور (Guardians Hub)" description="إدارة ملفات أولياء الأمور، ربط الأشقاء والطلاب ببوابات الدخول ومتابعة التقارير المالية المشتركة">
        <Button
          onClick={() => {
            setEditingGuardian(null);
            resetForm();
            setFormOpen(true);
          }}
          className="gap-2 rounded-xl"
        >
          <Plus className="h-4 w-4" />
          تسجيل ولي أمر جديد
        </Button>
      </PageHeader>

      <div className="bg-card p-5 border border-slate-200 rounded-2xl shadow-lg">
        <DataTable
          columns={columns}
          data={guardians?.data || []}
          isLoading={isLoading}
        />
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md text-right rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-primary">
              {editingGuardian ? 'تعديل بيانات ولي الأمر' : 'تسجيل ولي أمر جديد'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 my-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-black">الاسم الأول لولي الأمر:</Label>
                <Input
                  id="firstName"
                  placeholder="الاسم الأول"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="rounded-xl font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-black">اسم العائلة / الأخير:</Label>
                <Input
                  id="lastName"
                  placeholder="اسم العائلة"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="rounded-xl font-bold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-black">رقم الهاتف (الرئيسي):</Label>
              <Input
                id="phone"
                placeholder="مثال: 96555556666"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-xl font-bold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="whatsapp" className="text-xs font-black">رقم الواتساب للتنبيهات:</Label>
              <Input
                id="whatsapp"
                placeholder="مثال: 96555556666"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="rounded-xl font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="civilId" className="text-xs font-black">الرقم المدني:</Label>
                <Input
                  id="civilId"
                  placeholder="رقم البطاقة المدنية"
                  value={civilId}
                  onChange={(e) => setCivilId(e.target.value)}
                  className="rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-black">البريد الإلكتروني:</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="parent@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl font-bold"
                />
              </div>
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

      {/* Link Student Dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-md text-right rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-primary">
              ربط وتخصيص طالب جديد لولي الأمر
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleLinkStudent} className="space-y-4 my-3">
            <div className="space-y-1.5">
              <Label htmlFor="studentSelect" className="text-xs font-black">اختر الطالب لربطه بملف هذا الأب/الأم:</Label>
              <select
                id="studentSelect"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-1 text-sm font-bold shadow-sm"
              >
                <option value="">تحديد الطالب...</option>
                {students?.data?.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.parentName} (كود: {s.studentCode})
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="gap-2 sm:justify-start flex-row-reverse border-t pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLinkOpen(false)}
                className="rounded-xl font-bold text-xs"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={linkMutation.isPending}
                className="rounded-xl font-black bg-secondary hover:bg-secondary/90 text-white text-xs"
              >
                {linkMutation.isPending ? 'جاري الربط...' : 'تأكيد عملية الربط'}
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
        title="حذف ملف ولي الأمر"
        description="هل أنت متأكد من حذف هذا الملف؟ هذا الإجراء لن يحذف ملفات الطلاب المرتبطة به."
      />
    </div>
  );
};

export default GuardiansListPage;
