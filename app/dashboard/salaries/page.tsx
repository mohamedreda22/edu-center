'use client';

import { useState, useEffect, useCallback } from 'react';

interface Teacher {
  id: string;
  employeeId: string;
  hourlyRate: number;
  user: { firstName: string; lastName: string; phone: string };
}

interface Salary {
  id: string;
  teacherId: string;
  month: number;
  year: number;
  lessonsCount: number;
  hoursWorked: number;
  hourlyRate: number;
  transportationAllowance: number;
  bonuses: number;
  deductions: number;
  totalSalary: number;
  paid: boolean;
  paidDate: string | null;
  notes: string | null;
  teacher: {
    id: string;
    employeeId: string;
    hourlyRate: number;
    user: { firstName: string; lastName: string; phone: string };
  };
}

export default function SalariesPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [formData, setFormData] = useState({
    teacherId: '', month: selectedMonth, year: selectedYear,
    lessonsCount: 0, hoursWorked: 0, hourlyRate: 0,
    transportationAllowance: 0, bonuses: 0, deductions: 0, notes: '',
  });
  const [autoData, setAutoData] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        fetch('/api/teachers?limit=1000'),
        fetch(`/api/salaries?month=${selectedMonth}&year=${selectedYear}`),
      ]);
      const tData = await tRes.json();
      const sData = await sRes.json();
      setTeachers(tData.teachers || []);
      setSalaries(sData.salaries || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [selectedMonth, selectedYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPayroll = salaries.reduce((s, sal) => s + sal.totalSalary, 0);
  const totalPaid = salaries.filter(s => s.paid).reduce((s, sal) => s + sal.totalSalary, 0);
  const totalUnpaid = salaries.filter(s => !s.paid).reduce((s, sal) => s + sal.totalSalary, 0);

  const autoCalculate = async (teacherId: string) => {
    setCalculating(true);
    setError('');
    try {
      const res = await fetch('/api/salaries/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId, month: selectedMonth, year: selectedYear }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setAutoData(data);
      setFormData(prev => ({
        ...prev, teacherId,
        lessonsCount: data.lessonsCount,
        hoursWorked: data.hoursWorked,
        hourlyRate: data.hourlyRate,
      }));
      setShowAddModal(true);
    } catch (err) { setError('فشل الاتصال'); }
    finally { setCalculating(false); }
  };

  const openManual = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    setAutoData(null);
    setFormData({
      teacherId, month: selectedMonth, year: selectedYear,
      lessonsCount: 0, hoursWorked: 0,
      hourlyRate: teacher?.hourlyRate || 0,
      transportationAllowance: 0, bonuses: 0, deductions: 0, notes: '',
    });
    setShowAddModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/salaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess('تم تسجيل الراتب بنجاح');
      setShowAddModal(false);
      fetchData();
    } catch { setError('فشل الاتصال'); }
  };

  const markPaid = async (salary: Salary) => {
    try {
      const res = await fetch(`/api/salaries/${salary.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid: !salary.paid }),
      });
      if (res.ok) fetchData();
    } catch { setError('فشل الاتصال'); }
  };

  const deleteSalary = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الراتب؟')) return;
    try {
      await fetch(`/api/salaries/${id}`, { method: 'DELETE' });
      fetchData();
    } catch { setError('فشل الاتصال'); }
  };

  const computeTotal = () => {
    return Math.max(0,
      formData.hoursWorked * formData.hourlyRate +
      formData.transportationAllowance +
      formData.bonuses -
      formData.deductions
    );
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">رواتب المعلمين</h1>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 text-blue-700 p-4 rounded-lg shadow-sm">
          <div className="text-2xl mb-1">💰</div>
          <div className="text-sm opacity-80">إجمالي الرواتب</div>
          <div className="text-xl font-bold">{totalPayroll.toFixed(2)} د.ك</div>
        </div>
        <div className="bg-green-50 text-green-700 p-4 rounded-lg shadow-sm">
          <div className="text-2xl mb-1">✅</div>
          <div className="text-sm opacity-80">مدفوع</div>
          <div className="text-xl font-bold">{totalPaid.toFixed(2)} د.ك</div>
        </div>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg shadow-sm">
          <div className="text-2xl mb-1">⏳</div>
          <div className="text-sm opacity-80">غير مدفوع</div>
          <div className="text-xl font-bold">{totalUnpaid.toFixed(2)} د.ك</div>
        </div>
        <div className="bg-purple-50 text-purple-700 p-4 rounded-lg shadow-sm">
          <div className="text-2xl mb-1">👨‍🏫</div>
          <div className="text-sm opacity-80">المعلمون</div>
          <div className="text-xl font-bold">{salaries.length} / {teachers.filter(t => t.user).length}</div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex gap-4 items-center flex-wrap">
        <div>
          <label className="text-sm text-gray-600 ml-1">الشهر:</label>
          <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="border rounded px-3 py-1">
            {monthNames.map((name, i) => <option key={i} value={i + 1}>{name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600 ml-1">السنة:</label>
          <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="border rounded px-3 py-1">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex gap-2 mr-auto">
          <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)} className="border rounded px-3 py-1">
            <option value="">اختر معلماً...</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.user.firstName} {t.user.lastName} ({t.employeeId})</option>
            ))}
          </select>
          <button onClick={() => { if (selectedTeacherId) autoCalculate(selectedTeacherId); else setError('يرجى اختيار معلم أولاً'); }} disabled={calculating} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50">
            {calculating ? 'جاري الحساب...' : 'احتساب تلقائي'}
          </button>
          <button onClick={() => openManual(selectedTeacherId)} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
            + إدخال يدوي
          </button>
        </div>
      </div>

      {/* Salaries Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 text-right">#</th>
                <th className="p-3 text-right">المعلم</th>
                <th className="p-3 text-right">رقم الموظف</th>
                <th className="p-3 text-right">الحصص</th>
                <th className="p-3 text-right">الساعات</th>
                <th className="p-3 text-right">السعر/ساعة</th>
                <th className="p-3 text-right">مواصلات</th>
                <th className="p-3 text-right">مكافآت</th>
                <th className="p-3 text-right">خصومات</th>
                <th className="p-3 text-right">الإجمالي</th>
                <th className="p-3 text-center">الحالة</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {salaries.length === 0 ? (
                <tr><td colSpan={12} className="p-6 text-center text-gray-500">لا توجد رواتب مسجلة لهذا الشهر</td></tr>
              ) : (
                salaries.map((sal, idx) => (
                  <tr key={sal.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{idx + 1}</td>
                    <td className="p-3 font-medium">{sal.teacher.user.firstName} {sal.teacher.user.lastName}</td>
                    <td className="p-3 text-gray-600">{sal.teacher.employeeId}</td>
                    <td className="p-3">{sal.lessonsCount}</td>
                    <td className="p-3">{sal.hoursWorked}</td>
                    <td className="p-3">{sal.hourlyRate} د.ك</td>
                    <td className="p-3">{sal.transportationAllowance} د.ك</td>
                    <td className="p-3 text-green-600">{sal.bonuses > 0 ? `+${sal.bonuses}` : '-'}</td>
                    <td className="p-3 text-red-600">{sal.deductions > 0 ? `-${sal.deductions}` : '-'}</td>
                    <td className="p-3 font-bold">{sal.totalSalary.toFixed(2)} د.ك</td>
                    <td className="p-3 text-center">
                      <button onClick={() => markPaid(sal)} className={`px-2 py-1 rounded text-sm ${sal.paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {sal.paid ? 'مدفوع ✅' : 'غير مدفوع ⏳'}
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => deleteSalary(sal.id)} className="text-red-600 hover:text-red-800 text-sm">حذف</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Salary Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">
              {autoData ? 'احتساب الراتب - تلقائي' : 'إدخال راتب يدوي'}
            </h2>
            <form onSubmit={handleCreate}>
              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">المعلم</label>
                <select value={formData.teacherId} onChange={e => setFormData(prev => ({ ...prev, teacherId: e.target.value }))} className="w-full border rounded px-3 py-2" required>
                  <option value="">اختر معلماً</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.user.firstName} {t.user.lastName} ({t.employeeId})</option>
                  ))}
                </select>
              </div>

              {autoData && (
                <div className="bg-blue-50 p-3 rounded mb-3 text-sm">
                  <p>تم احتساب <strong>{autoData.lessonsCount}</strong> حصة بواقع <strong>{autoData.hoursWorked}</strong> ساعات</p>
                  <p>الراتب الأساسي: <strong>{autoData.baseSalary.toFixed(2)} د.ك</strong></p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">عدد الحصص</label>
                  <input type="number" value={formData.lessonsCount} onChange={e => setFormData(prev => ({ ...prev, lessonsCount: parseInt(e.target.value) || 0 }))} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">عدد الساعات</label>
                  <input type="number" step="0.5" value={formData.hoursWorked} onChange={e => setFormData(prev => ({ ...prev, hoursWorked: parseFloat(e.target.value) || 0 }))} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">السعر/ساعة</label>
                  <input type="number" step="0.5" value={formData.hourlyRate} onChange={e => setFormData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">بدل مواصلات</label>
                  <input type="number" step="0.5" value={formData.transportationAllowance} onChange={e => setFormData(prev => ({ ...prev, transportationAllowance: parseFloat(e.target.value) || 0 }))} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">مكافآت</label>
                  <input type="number" step="0.5" value={formData.bonuses} onChange={e => setFormData(prev => ({ ...prev, bonuses: parseFloat(e.target.value) || 0 }))} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">خصومات</label>
                  <input type="number" step="0.5" value={formData.deductions} onChange={e => setFormData(prev => ({ ...prev, deductions: parseFloat(e.target.value) || 0 }))} className="w-full border rounded px-3 py-2" />
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded mb-3 text-center">
                <span className="text-lg font-bold">الإجمالي: {computeTotal().toFixed(2)} د.ك</span>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">ملاحظات</label>
                <textarea value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))} className="w-full border rounded px-3 py-2" rows={2} />
              </div>

              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">حفظ الراتب</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
