import React from 'react';
import { useForm } from 'react-hook-form';

import FormDialog from '@/shared/components/FormDialog/FormDialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';

const AttendanceDialog = ({
  open,
  onOpenChange,
  lesson,
  onSubmit,
  isSubmitting,
}) => {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      status: 'PRESENT',
      notes: '',
      absenceReason: '',
      checkInTime: new Date().toISOString().slice(0, 16),
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        status: 'PRESENT',
        notes: lesson?.notes || '',
        absenceReason: '',
        checkInTime: new Date().toISOString().slice(0, 16),
      });
    }
  }, [open, lesson, reset]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="تحضير الحصة"
      saveText="حفظ التحضير"
      isSubmitting={isSubmitting}
      formId="attendance-form"
    >
      <form
        id="attendance-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 text-right"
      >
        <div className="space-y-2">
          <Label>حالة الحضور</Label>
          <select
            {...register('status')}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="PRESENT">حاضر</option>
            <option value="LATE">متأخر</option>
            <option value="ABSENT">غائب</option>
            <option value="EXCUSED">غائب بعذر</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>وقت تسجيل الحضور</Label>
          <Input type="datetime-local" {...register('checkInTime')} />
        </div>

        <div className="space-y-2">
          <Label>سبب الغياب (إن وجد)</Label>
          <Input
            {...register('absenceReason')}
            placeholder="أدخل السبب هنا..."
          />
        </div>

        <div className="space-y-2">
          <Label>ملاحظات المعلم</Label>
          <Input {...register('notes')} placeholder="أدخل الملاحظات هنا..." />
        </div>
      </form>
    </FormDialog>
  );
};

export default AttendanceDialog;
