'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Student {
  id: string;
  studentId: string;
  status: string;
  grade: string | null;
  subjects: string | null;
  address: string | null;
  parentName: string | null;
  parentPhone: string | null;
  whatsapp: string | null;
  area: string | null;
  school: string | null;
  preferredTeacherGender: string | null;
  preferredSchedule: string | null;
  notes: string | null;
  user: { firstName: string; lastName: string; phone: string; };
}

interface Pagination {
  page: number; limit: number; total: number; totalPages: number;
}

type FormMode = 'add' | 'edit';

const emptyForm = {
  name: '', phone: '', parentName: '', parentPhone: '', whatsapp: '',
  area: '', address: '', googleMapsUrl: '', school: '',
  grade: '', subjects: '', preferredTeacherGender: '', preferredSchedule: '', notes: '',
};

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('add');
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function fetchStudents(page = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/students?${params}`);
      if (res.status === 401) { router.push('/login'); return; }
      const data = await res.json();
      setStudents(data.students);
      setPagination(data.pagination);
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchStudents(); }, [statusFilter]);

  function handleSearch(e: React.FormEvent) { e.preventDefault(); fetchStudents(1); }

  async function handleArchive(id: string) {
    if (!confirm('هل أنت متأكد من أرشفة هذا الطالب؟')) return;
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    if (res.ok) fetchStudents(pagination.page);
    else { const d = await res.json(); alert(d.error || 'فشلت العملية'); }
  }

  function openAddModal() { setForm(emptyForm); setFormMode('add'); setEditId(null); setFormError(''); setShowModal(true); }

  function openEditModal(s: Student) {
    setForm({
      name: `${s.user.firstName} ${s.user.lastName}`,
      phone: s.user.phone,
      parentName: s.parentName || '',
      parentPhone: s.parentPhone || '',
      whatsapp: s.whatsapp || '',
      area: s.area || '',
      address: s.address || '',
      googleMapsUrl: '',
      school: s.school || '',
      grade: s.grade || '',
      subjects: s.subjects || '',
      preferredTeacherGender: s.preferredTeacherGender || '',
      preferredSchedule: s.preferredSchedule || '',
      notes: s.notes || '',
    });
    setFormMode('edit'); setEditId(s.id); setFormError(''); setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setFormError('');
    try {
      const body = {
        ...form,
        parentName: form.parentName || undefined,
        parentPhone: form.parentPhone || undefined,
        whatsapp: form.whatsapp || undefined,
        area: form.area || undefined,
        googleMapsUrl: form.googleMapsUrl || undefined,
        school: form.school || undefined,
        preferredTeacherGender: (form.preferredTeacherGender as 'MALE' | 'FEMALE' | '') || undefined,
        preferredSchedule: form.preferredSchedule || undefined,
        notes: form.notes || undefined,
      };
      const url = formMode === 'add' ? '/api/students' : `/api/students/${editId}`;
      const method = formMode === 'add' ? 'POST' : 'PATCH';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); setFormError(d.error || 'فشلت العملية'); return; }
      setShowModal(false); fetchStudents(1);
    } finally { setSaving(false); }
  }

  function countByStatus(s: string) {
    return s === '' ? students.length : students.filter((st) => st.status === s).length;
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700 bg-green-500',
      INACTIVE: 'bg-yellow-100 text-yellow-700 bg-yellow-500',
      WITHDRAWN: 'bg-red-100 text-red-700 bg-red-500',
    };
    const s = styles[status] || styles.ACTIVE;
    const parts = s.split(' ');
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${parts[0]} ${parts[1]}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${parts[2]}`} />
        {status === 'ACTIVE' ? 'نشط' : status === 'INACTIVE' ? 'غير نشط' : 'منسحب'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">الطلاب</h1>
        <button onClick={openAddModal} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          إضافة طالب
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 shadow-sm border"><p className="text-2xl font-bold text-blue-600">{pagination.total}</p><p className="text-sm text-gray-500 mt-1">الإجمالي</p></div>
        <div className="bg-green-50 rounded-xl p-4 shadow-sm border"><p className="text-2xl font-bold text-green-600">{countByStatus('ACTIVE')}</p><p className="text-sm text-gray-500 mt-1">نشط</p></div>
        <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border"><p className="text-2xl font-bold text-yellow-600">{countByStatus('INACTIVE')}</p><p className="text-sm text-gray-500 mt-1">غير نشط</p></div>
        <div className="bg-red-50 rounded-xl p-4 shadow-sm border"><p className="text-2xl font-bold text-red-600">{countByStatus('WITHDRAWN')}</p><p className="text-sm text-gray-500 mt-1">منسحب</p></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 mb-6">
          <div className="flex-1 min-w-[200px] relative">
            <svg className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم، رقم الطالب، الهاتف، المدرسة..."
              className="w-full border rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">جميع الحالات</option>
            <option value="ACTIVE">نشط</option>
            <option value="INACTIVE">غير نشط</option>
            <option value="WITHDRAWN">منسحب</option>
          </select>
          <button type="submit" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium">بحث</button>
        </form>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-500">جاري تحميل البيانات...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <h3 className="text-lg font-medium text-gray-700 mb-2">لا يوجد طلاب</h3>
            <p className="text-gray-400 mb-6">لم يتم إضافة أي طالب بعد.</p>
            <button onClick={openAddModal} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium">إضافة طالب جديد</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="py-3 px-4 text-xs font-semibold text-gray-600">#</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-600">الاسم</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-600">ولي الأمر</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-600">الهاتف</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-600">المدرسة</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-600">الصف</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-600">المواد</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-600">الحالة</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-600"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition">
                    <td className="py-3 px-4 font-medium text-gray-800">{s.studentId}</td>
                    <td className="py-3 px-4">{s.user.firstName} {s.user.lastName}</td>
                    <td className="py-3 px-4 text-gray-500">{s.parentName || '-'}</td>
                    <td className="py-3 px-4 text-gray-500" dir="ltr">{s.user.phone}</td>
                    <td className="py-3 px-4 text-gray-500">{s.school || '-'}</td>
                    <td className="py-3 px-4 text-gray-500">{s.grade || '-'}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-[150px] truncate">{s.subjects || '-'}</td>
                    <td className="py-3 px-4">{statusBadge(s.status)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(s)} className="text-blue-500 hover:text-blue-700 text-sm font-medium transition">تعديل</button>
                        {s.status !== 'WITHDRAWN' && (
                          <button onClick={() => handleArchive(s.id)} className="text-red-500 hover:text-red-700 text-sm font-medium transition">أرشفة</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <p className="text-sm text-gray-500">الصفحة {pagination.page} من {pagination.totalPages} — إجمالي {pagination.total} طالب</p>
            <div className="flex gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => fetchStudents(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition ${page === pagination.page ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border'}`}>{page}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 mb-8">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-gray-900">{formMode === 'add' ? 'إضافة طالب جديد' : 'تعديل بيانات الطالب'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف *</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required dir="ltr" className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">واتساب</label>
                  <input type="text" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} dir="ltr" className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم ولي الأمر</label>
                  <input type="text" value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">هاتف ولي الأمر</label>
                  <input type="text" value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} dir="ltr" className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المنطقة</label>
                  <input type="text" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="مثال: السالمية" className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">العنوان *</label>
                  <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المدرسة</label>
                  <input type="text" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} placeholder="مثال: مدرسة السلام" className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المرحلة الدراسية *</label>
                  <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} required className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">اختر المرحلة</option>
                    <option value="تأسيس">تأسيس</option>
                    <option value="ابتدائي">ابتدائي</option>
                    <option value="ثانوي">ثانوي</option>
                    <option value="جامعات ومعاهد">جامعات ومعاهد</option>
                    <option value="أجنبي">أجنبي</option>
                    <option value="احتياجات">احتياجات</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المواد الدراسية *</label>
                  <input type="text" value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} required placeholder="مثال: رياضيات, علوم" className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الجنس المفضل للمعلم</label>
                  <select value={form.preferredTeacherGender} onChange={(e) => setForm({ ...form, preferredTeacherGender: e.target.value })} className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">لا يوجد تفضيل</option>
                    <option value="MALE">ذكر</option>
                    <option value="FEMALE">أنثى</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الجدول الزمني المفضل</label>
                  <input type="text" value={form.preferredSchedule} onChange={(e) => setForm({ ...form, preferredSchedule: e.target.value })} placeholder="مثال: الأحد والأربعاء 4-6 مساءً" className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رابط Google Maps</label>
                  <input type="text" value={form.googleMapsUrl} onChange={(e) => setForm({ ...form, googleMapsUrl: e.target.value })} placeholder="https://maps.google.com/..." dir="ltr" className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{formError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium">إلغاء</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50">
                  {saving ? 'جاري الحفظ...' : formMode === 'add' ? 'حفظ الطالب' : 'تحديث البيانات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
