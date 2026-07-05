'use client';

import { useState, useEffect, useCallback } from 'react';

interface Lesson {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  lessonDate: string;
  status: string;
  notes: string | null;
  teacher: { id: string; employeeId: string; user: { firstName: string; lastName: string } };
  student: { id: string; studentId: string; user: { firstName: string; lastName: string } };
}

export default function AttendancePage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filter, setFilter] = useState('all');
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lessons?date=${selectedDate}`);
      const data = await res.json();
      setLessons(data.lessons || []);
      const notes: Record<string, string> = {};
      (data.lessons || []).forEach((l: Lesson) => { notes[l.id] = l.notes || ''; });
      setNoteInputs(notes);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [selectedDate]);

  useEffect(() => { fetchLessons(); }, [fetchLessons]);

  const updateStatus = async (lessonId: string, status: string) => {
    try {
      await fetch(`/api/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes: noteInputs[lessonId] || null }),
      });
      fetchLessons();
    } catch (err) { console.error(err); }
  };

  const updateNotes = async (lessonId: string) => {
    try {
      await fetch(`/api/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: noteInputs[lessonId] || null }),
      });
    } catch (err) { console.error(err); }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-300';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-300';
      case 'NO_SHOW': return 'bg-gray-100 text-gray-700 border-gray-300';
      default: return 'bg-gray-50 text-gray-500';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'مجدول';
      case 'COMPLETED': return 'تمت';
      case 'CANCELLED': return 'ملغية';
      case 'NO_SHOW': return 'لم يحضر';
      default: return status;
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const filteredLessons = filter === 'all' ? lessons : lessons.filter(l => l.status === filter);

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">سجل الحضور</h1>
        <div className="flex gap-2 items-center">
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="border rounded px-3 py-1" />
          <button onClick={() => setSelectedDate(today)} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm">اليوم</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 text-blue-700 p-4 rounded-lg shadow-sm">
          <div className="text-sm opacity-80">إجمالي الحصص</div>
          <div className="text-xl font-bold">{lessons.length}</div>
        </div>
        <div className="bg-green-50 text-green-700 p-4 rounded-lg shadow-sm">
          <div className="text-sm opacity-80">تمت</div>
          <div className="text-xl font-bold">{lessons.filter(l => l.status === 'COMPLETED').length}</div>
        </div>
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg shadow-sm">
          <div className="text-sm opacity-80">مجدولة</div>
          <div className="text-xl font-bold">{lessons.filter(l => l.status === 'SCHEDULED').length}</div>
        </div>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg shadow-sm">
          <div className="text-sm opacity-80">ملغية / لم يحضر</div>
          <div className="text-xl font-bold">{lessons.filter(l => l.status === 'CANCELLED' || l.status === 'NO_SHOW').length}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex gap-2">
        {['all', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded text-sm ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {f === 'all' ? 'الكل' : statusLabel(f)}
          </button>
        ))}
      </div>

      {/* Lessons List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
      ) : filteredLessons.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-sm">لا توجد حصص في هذا التاريخ</div>
      ) : (
        <div className="space-y-3">
          {filteredLessons.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(lesson => (
            <div key={lesson.id} className={`bg-white rounded-lg shadow-sm border-r-4 ${statusColor(lesson.status).split(' ')[2]} p-4`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-bold">{lesson.title}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(lesson.status)}`}>
                      {statusLabel(lesson.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>🕐 {lesson.startTime} - {lesson.endTime} ({lesson.durationHours}h)</p>
                    <p>👨‍🏫 المعلم: {lesson.teacher.user.firstName} {lesson.teacher.user.lastName}</p>
                    <p>👤 الطالب: {lesson.student.user.firstName} {lesson.student.user.lastName}</p>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input type="text" placeholder="ملاحظات..." value={noteInputs[lesson.id] || ''}
                      onChange={e => setNoteInputs(prev => ({ ...prev, [lesson.id]: e.target.value }))}
                      className="border rounded px-2 py-1 text-sm flex-1" />
                    <button onClick={() => updateNotes(lesson.id)} className="text-xs text-blue-600 hover:text-blue-800">حفظ</button>
                  </div>
                </div>
                <div className="flex flex-col gap-1 mr-4">
                  {['SCHEDULED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'].map(s => (
                    <button key={s} onClick={() => updateStatus(lesson.id, s)}
                      className={`px-3 py-1 rounded text-xs font-medium ${lesson.status === s ? 'ring-2 ring-blue-500' : ''} ${s === 'SCHEDULED' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : s === 'COMPLETED' ? 'bg-green-100 text-green-700 hover:bg-green-200' : s === 'CANCELLED' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      {statusLabel(s)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
