import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';

import AttendanceDialog from '../components/AttendanceDialog';
import LessonFormDialog from '../components/LessonFormDialog';
import WeekScheduleGrid from '../components/WeekScheduleGrid';
import { schedulingApi } from '../services/schedulingApi';

import PageHeader from '@/shared/components/PageHeader/PageHeader';
import { Button } from '@/shared/components/ui/button';

const SchedulePage = () => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [error, setError] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['lessons'],
    queryFn: () => schedulingApi.getAllLessons(),
  });

  const createMutation = useMutation({
    mutationFn: schedulingApi.createLesson,
    onSuccess: () => {
      queryClient.invalidateQueries(['lessons']);
      setFormOpen(false);
      setError(null);
    },
    onError: (err) => {
      setError(err.response?.data?.error?.message || 'حدث خطأ أثناء الحجز');
    },
  });

  const handleCreate = (formData) => {
    // Add dayOfWeek (could be derived server-side too)
    const date = new Date(formData.lessonDate);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    createMutation.mutate({ ...formData, dayOfWeek });
  };

  const markAttendanceMutation = useMutation({
    mutationFn: (data) =>
      schedulingApi.markAttendance(selectedLesson._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['lessons']);
      setAttendanceOpen(false);
      setSelectedLesson(null);
    },
  });

  const handleMarkAttendance = (formData) => {
    markAttendanceMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <PageHeader title="الجدول الدراسي" description="عرض وحجز الحصص الدراسية">
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          حجز حصة
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-xl">
          جاري تحميل الجدول...
        </div>
      ) : (
        <WeekScheduleGrid
          lessons={data?.data || []}
          onLessonClick={(l) => {
            setSelectedLesson(l);
            setAttendanceOpen(true);
          }}
        />
      )}

      <LessonFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
        error={error}
      />

      <AttendanceDialog
        open={attendanceOpen}
        onOpenChange={setAttendanceOpen}
        lesson={selectedLesson}
        onSubmit={handleMarkAttendance}
        isSubmitting={markAttendanceMutation.isPending}
      />
    </div>
  );
};

export default SchedulePage;
