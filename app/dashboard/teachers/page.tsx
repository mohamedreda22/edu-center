'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Teacher {
  id: string;
  employeeId: string;
  whatsapp: string | null;
  civilId: string | null;
  subjects: string;
  gradesTaught: string;
  gender: string | null;
  nationality: string | null;
  experience: number;
  address: string | null;
  availableDays: string;
  availableHours: string;
  ownsCar: boolean;
  transportationAvailable: boolean;
  hourlyRate: number;
  rating: number | null;
  notes: string | null;
  isActive: boolean;
  commissionModel: string;
  usesInstituteCar: boolean;
  user: { firstName: string; lastName: string; phone: string; };
}

interface Pagination {
  page: number; limit: number; total: number; totalPages: number;
}

type FormMode = 'add' | 'edit';

const emptyForm = {
  name: '', phone: '', whatsapp: '', civilId: '', subjects: '', gradesTaught: '',
  gender: '' as string, nationality: '', experience: 0, address: '',
  googleMapsUrl: '', availableDays: '', availableHours: '',
  ownsCar: false, transportationAvailable: false,
  hourlyRate: 0, rating: '', notes: '', isActive: true,
  commissionModel: 'SEVENTY_THIRTY', usesInstituteCar: false,
};

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('add');
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function fetchTeachers(page = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (search) params.set('search', search);
      const res = await fetch(`/api/teachers?${params}`);
      if (res.status === 401) { router.push('/login'); return; }
      const data = await res.json();
      setTeachers(data.teachers);
      setPagination(data.pagination);
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchTeachers(); }, []);

  function handleSearch(e: React.FormEvent) { e.preventDefault(); fetchTeachers(1); }

  function openAddModal() {
    setForm(emptyForm);
    setFormMode('add');
    setEditId(null);
    setFormError('');
    setShowModal(true);
  }

  function openEditModal(t: Teacher) {
    setForm({
      name: `${t.user.firstName} ${t.user.lastName}`,
      phone: t.user.phone,
      whatsapp: t.whatsapp || '',
      civilId: t.civilId || '',
      subjects: t.subjects,
      gradesTaught: t.gradesTaught,
      gender: t.gender || '',
      nationality: t.nationality || '',
      experience: t.experience,
      address: t.address || '',
      googleMapsUrl: '',
      availableDays: t.availableDays,
      availableHours: t.availableHours,
      ownsCar: t.ownsCar,
      transportationAvailable: t.transportationAvailable,
      hourlyRate: t.hourlyRate,
      rating: t.rating?.toString() || '',
      notes: t.notes || '',
      isActive: t.isActive,
      commissionModel: t.commissionModel || 'SEVENTY_THIRTY',
      usesInstituteCar: t.usesInstituteCar ?? false,
    });
    setFormMode('edit');
    setEditId(t.id);
    setFormError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const body = {
        ...form,
        whatsapp: form.whatsapp || undefined,
        civilId: form.civilId || undefined,
        gender: form.gender || undefined,
        nationality: form.nationality || undefined,
        address: form.address || undefined,
        googleMapsUrl: form.googleMapsUrl || undefined,
        notes: form.notes || undefined,
        rating: form.rating ? parseFloat(form.rating) : undefined,
      };
      const url = formMode === 'add' ? '/api/teachers' : `/api/teachers/${editId}`;
      const method = formMode === 'add' ? 'POST' : 'PATCH';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const d = await res.json();
        setFormError(d.error || 'فشلت العملية');
        return;
      }
      setShowModal(false);
      fetchTeachers(1);
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`هل أنت متأكد من حذف المعلم "${name}"؟`)) return;
    const res = await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
    if (res.ok) fetchTeachers(pagination.page);
    else { const d = await res.json(); alert(d.error || 'فشل الحذف'); }
  }

  const daysList = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  const dayMap: Record<string, string> = { Saturday: 'السبت', Sunday: 'الأحد', Monday: 'الإثنين', Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء', Thursday: 'الخميس', Friday: 'الجمعة' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">المعلمون</h1>
        <button onClick={openAddModal} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          إضافة معلم
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المعلمين', value: pagination.total, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'نشط', value: teachers.filter((t) => t.isActive).length, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'غير نشط', value: teachers.filter((t) => !t.isActive).length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'متوسط التقييم', value: teachers.reduce((a, t) => a + (t.rating || 0), 0) > 0 ? (teachers.reduce((a, t) => a + (t.rating || 0), 0) / teachers.filter(t => t.rating).length).toFixed(1) : '-', color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4 shadow-sm border`}>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 mb-6">
          <div className="flex-1 min-w-[200px] relative">
            <svg className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو رقم الموظف..."
              className="w-full border rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium">بحث</button>
        </form>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-500">جاري تحميل البيانات...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
            <h3 className="text-lg font-medium text-gray-700 mb-2">لا يوجد معلمون</h3>
            <p className="text-gray-400 mb-6">لم يتم إضافة أي معلم بعد.</p>
            <button onClick={openAddModal} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium">إضافة معلم جديد</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="py-3 px-4 text-xs font-semibold text-gray-600">#</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-600">الاسم</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-600">الجوال</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-600">المواد</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-600">الصفوف</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-600">الساعة</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-600">التقييم</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-600">الحالة</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-600"></th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition">
                    <td className="py-3 px-4 font-medium text-gray-800">{t.employeeId}</td>
                    <td className="py-3 px-4">{t.user.firstName} {t.user.lastName}</td>
                    <td className="py-3 px-4 text-gray-500" dir="ltr">{t.user.phone}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-[150px] truncate">{t.subjects || '-'}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-[120px] truncate">{t.gradesTaught || '-'}</td>
                    <td className="py-3 px-4 text-gray-500">{t.hourlyRate > 0 ? `${t.hourlyRate} د.ك` : '-'}</td>
                    <td className="py-3 px-4">
                      {t.rating ? (
                        <span className="inline-flex items-center gap-1 text-yellow-600">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          {t.rating.toFixed(1)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        {t.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(t)} className="text-blue-500 hover:text-blue-700 text-sm font-medium transition">تعديل</button>
                        <button onClick={() => handleDelete(t.id, `${t.user.firstName} ${t.user.lastName}`)} className="text-red-500 hover:text-red-700 text-sm font-medium transition">حذف</button>
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
            <p className="text-sm text-gray-500">الصفحة {pagination.page} من {pagination.totalPages} — إجمالي {pagination.total} معلم</p>
            <div className="flex gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => fetchTeachers(page)}
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
              <h2 className="text-xl font-bold text-gray-900">{formMode === 'add' ? 'إضافة معلم جديد' : 'تعديل بيانات المعلم'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجوال *</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required dir="ltr" className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">واتساب</label>
                  <input type="text" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} dir="ltr" className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الرقم المدني</label>
                  <input type="text" value={form.civilId} onChange={(e) => setForm({ ...form, civilId: e.target.value })} className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الجنس</label>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">اختر</option>
                    <option value="MALE">ذكر</option>
                    <option value="FEMALE">أنثى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الجنسية</label>
                  <input type="text" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} placeholder="مثال: مصري" className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              {/* Subjects & Grades */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المواد الدراسية *</label>
                  <input type="text" value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} required placeholder="مثال: رياضيات, فيزياء" className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المراحل التي يدرسها *</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {['تأسيس', 'ابتدائي', 'ثانوي', 'جامعات ومعاهد', 'أجنبي', 'احتياجات'].map((level) => (
                      <label key={level} className="flex items-center gap-1.5 cursor-pointer text-sm">
                        <input type="checkbox" checked={form.gradesTaught.split(', ').includes(level)} onChange={() => {
                          const levels = form.gradesTaught ? form.gradesTaught.split(', ') : [];
                          const updated = levels.includes(level) ? levels.filter((l) => l !== level) : [...levels, level];
                          setForm({ ...form, gradesTaught: updated.join(', ') });
                        }} className="w-4 h-4 text-blue-600 rounded" />
                        {level}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Experience & Rate */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سنوات الخبرة</label>
                  <input type="number" min="0" value={form.experience} onChange={(e) => setForm({ ...form, experience: parseInt(e.target.value) || 0 })} className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">السعر للساعة (د.ك)</label>
                  <input type="number" min="0" step="0.5" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: parseFloat(e.target.value) || 0 })} className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">التقييم (من 5)</label>
                  <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              {/* Transport */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">يمتلك سيارة</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="ownsCar" checked={form.ownsCar === true} onChange={() => setForm({ ...form, ownsCar: true })} className="w-4 h-4 text-blue-600" />
                      <span>نعم</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="ownsCar" checked={form.ownsCar === false} onChange={() => setForm({ ...form, ownsCar: false })} className="w-4 h-4 text-blue-600" />
                      <span>لا</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">وسيلة نقل متاحة</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="transport" checked={form.transportationAvailable === true} onChange={() => setForm({ ...form, transportationAvailable: true })} className="w-4 h-4 text-blue-600" />
                      <span>نعم</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="transport" checked={form.transportationAvailable === false} onChange={() => setForm({ ...form, transportationAvailable: false })} className="w-4 h-4 text-blue-600" />
                      <span>لا</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Available Days & Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الأيام المتاحة</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((day) => (
                      <label key={day} className="flex items-center gap-1.5 cursor-pointer text-sm">
                        <input type="checkbox" checked={form.availableDays.includes(day)} onChange={() => {
                          const days = form.availableDays ? form.availableDays.split(', ') : [];
                          const updated = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
                          setForm({ ...form, availableDays: updated.join(', ') });
                        }} className="w-4 h-4 text-blue-600 rounded" />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الساعات المتاحة</label>
                  <input type="text" value={form.availableHours} onChange={(e) => setForm({ ...form, availableHours: e.target.value })} placeholder="مثال: 9:00-13:00, 16:00-20:00" className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              {/* Commission Model */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نموذج العمولة</label>
                  <select value={form.commissionModel} onChange={(e) => setForm({ ...form, commissionModel: e.target.value })} className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="SEVENTY_THIRTY">70% معلم / 30% معهد</option>
                    <option value="SIXTYFIVE_THIRTYFIVE">65% معلم / 35% معهد</option>
                  </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">يستخدم سيارة المعهد</label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="usesInstituteCar" checked={form.usesInstituteCar === true} onChange={() => setForm({ ...form, usesInstituteCar: true })} className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">نعم</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="usesInstituteCar" checked={form.usesInstituteCar === false} onChange={() => setForm({ ...form, usesInstituteCar: false })} className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">لا</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              {/* Active */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm font-medium text-gray-700">نشط</span>
                </label>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{formError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium">إلغاء</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50">
                  {saving ? 'جاري الحفظ...' : formMode === 'add' ? 'حفظ المعلم' : 'تحديث البيانات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
