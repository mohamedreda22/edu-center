'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Teacher { id: string; employeeId: string; user: { firstName: string; lastName: string; }; }
interface Student { id: string; studentId: string; user: { firstName: string; lastName: string; }; }

interface Lesson {
  id: string; title: string; dayOfWeek: string; startTime: string; endTime: string;
  durationHours: number; lessonDate: string; status: string; notes: string | null;
  teacher: { id: string; employeeId: string; user: { firstName: string; lastName: string } };
  student: { id: string; studentId: string; user: { firstName: string; lastName: string } };
}

const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function getWeekDates(ref: Date): Date[] {
  const d = new Date(ref);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  return dayNames.map((_, i) => { const dt = new Date(start); dt.setDate(start.getDate() + i); return dt; });
}

function formatDate(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

const timeSlots = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];

const statusBadge: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-yellow-100 text-yellow-700',
};

const emptyForm = { teacherId: '', studentId: '', subject: '', dayOfWeek: '', startTime: '16:00', durationHours: 1, date: '', notes: '', lessonPrice: 0, educationalLevel: '' };

export default function SchedulePage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'teacher' | 'student'>('teacher');
  const [selectedId, setSelectedId] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const today = new Date();
  const refDate = new Date(today);
  refDate.setDate(refDate.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(refDate);
  const weekStart = formatDate(weekDates[0]);
  const weekEnd = formatDate(weekDates[6]);

  useEffect(() => {
    Promise.all([
      fetch('/api/teachers?limit=100').then(r => r.json()),
      fetch('/api/students?limit=100').then(r => r.json()),
    ]).then(([tData, sData]) => {
      setTeachers(tData.teachers || []);
      setStudents(sData.students || []);
      if (tData.teachers?.length) setSelectedId(tData.teachers[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    fetch(`/api/lessons?${viewMode === 'teacher' ? `teacherId=${selectedId}` : `studentId=${selectedId}`}`)
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(data => { setLessons(data?.lessons || []); setLoading(false); });
  }, [selectedId, viewMode]);

  function getLessonsForDay(dayName: string) {
    return lessons.filter(l => l.dayOfWeek === dayName);
  }

  function getLessonPosition(l: Lesson) {
    const [h, m] = l.startTime.split(':').map(Number);
    const totalMin = h * 60 + m;
    const startMin = 8 * 60;
    const top = ((totalMin - startMin) / 60) * 80 + 4;
    const height = l.durationHours * 80 - 4;
    return { top: `${top}px`, height: `${height}px` };
  }

  function openAddModal() {
    setForm({ ...emptyForm, teacherId: viewMode === 'teacher' ? selectedId : '' });
    setFormError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setFormError('');
    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setFormError(d.error || 'فشل'); return; }
      setShowModal(false);
      // Re-fetch
      fetch(`/api/lessons?${viewMode === 'teacher' ? `teacherId=${selectedId}` : `studentId=${selectedId}`}`)
        .then(r => r.json()).then(data => setLessons(data?.lessons || []));
    } finally { setSaving(false); }
  }

  async function updateLessonStatus(id: string, status: string) {
    const res = await fetch(`/api/lessons/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      fetch(`/api/lessons?${viewMode === 'teacher' ? `teacherId=${selectedId}` : `studentId=${selectedId}`}`)
        .then(r => r.json()).then(data => setLessons(data?.lessons || []));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">الجدول الأسبوعي</h1>
        <button onClick={openAddModal} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          إضافة حصة
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => { setViewMode('teacher'); if (teachers.length) setSelectedId(teachers[0].id); }} className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'teacher' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>عرض حسب المعلم</button>
            <button onClick={() => { setViewMode('student'); if (students.length) setSelectedId(students[0].id); }} className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'student' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>عرض حسب الطالب</button>
          </div>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="border rounded-lg px-4 py-2 min-w-[200px] focus:ring-2 focus:ring-blue-500 outline-none">
            {viewMode === 'teacher' ? teachers.map(t => (
              <option key={t.id} value={t.id}>{t.employeeId} - {t.user.firstName} {t.user.lastName}</option>
            )) : students.map(s => (
              <option key={s.id} value={s.id}>{s.studentId} - {s.user.firstName} {s.user.lastName}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 mr-auto">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 rounded-lg hover:bg-gray-100 border transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[200px] text-center">
              {weekDates[0].toLocaleDateString('ar-SA', { month: 'long', day: 'numeric' })} — {weekDates[6].toLocaleDateString('ar-SA', { month: 'long', day: 'numeric' })}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 rounded-lg hover:bg-gray-100 border transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <button onClick={() => setWeekOffset(0)} className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium">اليوم</button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Header - Days */}
        <div className="grid grid-cols-7 border-b">
          {weekDates.map((d, i) => (
            <div key={i} className={`py-3 text-center border-l last:border-l-0 ${formatDate(d) === formatDate(today) ? 'bg-blue-50' : ''}`}>
              <p className="text-xs text-gray-500">{dayNames[i]}</p>
              <p className={`text-lg font-bold ${formatDate(d) === formatDate(today) ? 'text-blue-600' : 'text-gray-800'}`}>{d.getDate()}</p>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="relative overflow-x-auto">
          <div className="grid grid-cols-7 min-h-[600px]">
            {weekDates.map((_, dayIdx) => (
              <div key={dayIdx} className="border-l last:border-l-0 relative min-h-[600px] bg-white">
                {/* Hour lines */}
                {timeSlots.map((_, ti) => (
                  <div key={ti} className="border-b border-gray-50" style={{ height: '80px' }} />
                ))}
                {/* Lessons */}
                {getLessonsForDay(dayNames[dayIdx]).map((lesson) => {
                  const pos = getLessonPosition(lesson);
                  return (
                    <div key={lesson.id} className="absolute right-1 left-1 rounded-lg p-2 overflow-hidden cursor-pointer group" style={{ top: pos.top, height: pos.height, backgroundColor: lesson.status === 'SCHEDULED' ? '#dbeafe' : lesson.status === 'COMPLETED' ? '#d1fae5' : lesson.status === 'CANCELLED' ? '#fee2e2' : '#fef3c7' }}>
                      <p className="text-xs font-semibold text-gray-800 truncate">{lesson.title}</p>
                      <p className="text-xs text-gray-500 truncate">{lesson.startTime} - {lesson.endTime}</p>
                      <p className="text-xs text-gray-500 truncate">{lesson.student.user.firstName} {lesson.student.user.lastName}</p>
                      <div className="hidden group-hover:flex absolute top-1 left-1 gap-1">
                        {lesson.status === 'SCHEDULED' && (
                          <>
                            <button onClick={() => updateLessonStatus(lesson.id, 'COMPLETED')} className="w-5 h-5 bg-green-500 text-white rounded text-xs leading-5 text-center hover:bg-green-600" title="تمت">✓</button>
                            <button onClick={() => updateLessonStatus(lesson.id, 'CANCELLED')} className="w-5 h-5 bg-red-500 text-white rounded text-xs leading-5 text-center hover:bg-red-600" title="إلغاء">✕</button>
                            <button onClick={() => updateLessonStatus(lesson.id, 'NO_SHOW')} className="w-5 h-5 bg-yellow-500 text-white rounded text-xs leading-5 text-center hover:bg-yellow-600" title="لم يحضر">◯</button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Lesson Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">إضافة حصة جديدة</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المعلم *</label>
                  <select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} required className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">اختر معلم</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.user.firstName} {t.user.lastName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الطالب *</label>
                  <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">اختر طالب</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.user.firstName} {s.user.lastName}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المادة *</label>
                <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required placeholder="مثال: رياضيات" className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اليوم *</label>
                  <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} required className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">اختر اليوم</option>
                    {dayNames.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">وقت البداية *</label>
                  <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المدة (ساعات) *</label>
                  <input type="number" min="0.5" step="0.5" value={form.durationHours} onChange={(e) => setForm({ ...form, durationHours: parseFloat(e.target.value) || 1 })} required className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سعر الحصة (د.ك)</label>
                  <input type="number" min="0" step="0.5" value={form.lessonPrice} onChange={(e) => setForm({ ...form, lessonPrice: parseFloat(e.target.value) || 0 })} className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المرحلة الدراسية</label>
                  <select value={form.educationalLevel} onChange={(e) => setForm({ ...form, educationalLevel: e.target.value })} className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">اختر المرحلة</option>
                    <option value="تأسيس">تأسيس</option>
                    <option value="ابتدائي">ابتدائي</option>
                    <option value="ثانوي">ثانوي</option>
                    <option value="جامعات ومعاهد">جامعات ومعاهد</option>
                    <option value="أجنبي">أجنبي</option>
                    <option value="احتياجات">احتياجات</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              {formError && <div className="bg-red-50 border border-red-200 rounded-lg p-3"><p className="text-red-700 text-sm">{formError}</p></div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium">إلغاء</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50">
                  {saving ? 'جاري الحجز...' : 'حجز الحصة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
