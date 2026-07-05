'use client';

import { useState, useEffect, useCallback } from 'react';

interface PayrollRecord {
  id: string;
  teacherId: string;
  month: number;
  year: number;
  completedLessons: number;
  totalLessonValue: number;
  teacherEarnings: number;
  instituteRevenue: number;
  transportDeductions: number;
  finalAmount: number;
  paid: boolean;
  paidDate: string | null;
  notes: string | null;
  teacher: {
    id: string; employeeId: string; usesInstituteCar: boolean;
    user: { firstName: string; lastName: string };
  };
}

export default function PayrollPage() {
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [message, setMessage] = useState('');
  const [summary, setSummary] = useState<any>(null);

  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll?month=${selectedMonth}&year=${selectedYear}`);
      const data = await res.json();
      setRecords(data.records || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [selectedMonth, selectedYear]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const generatePayroll = async () => {
    setGenerating(true);
    setMessage('');
    setSummary(null);
    try {
      const res = await fetch('/api/payroll/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage(`❌ ${data.error}`); return; }
      setMessage(`✅ ${data.message}`);
      setSummary(data.summary);
      fetchRecords();
    } catch { setMessage('❌ فشل الاتصال'); }
    finally { setGenerating(false); }
  };

  const markPaid = async (recordId: string, currentPaid: boolean) => {
    try {
      await fetch(`/api/payroll/${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid: !currentPaid }),
      });
      fetchRecords();
    } catch { console.error('Failed to update'); }
  };

  const totals = {
    lessons: records.reduce((s, r) => s + r.completedLessons, 0),
    grossValue: records.reduce((s, r) => s + r.totalLessonValue, 0),
    teacherPay: records.reduce((s, r) => s + r.teacherEarnings, 0),
    instituteRev: records.reduce((s, r) => s + r.instituteRevenue, 0),
    deductions: records.reduce((s, r) => s + r.transportDeductions, 0),
    finalPay: records.reduce((s, r) => s + r.finalAmount, 0),
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">كشوفات الرواتب</h1>
        <div className="flex gap-2 items-center">
          <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="border rounded px-3 py-1">
            {monthNames.map((n, i) => <option key={i} value={i + 1}>{n}</option>)}
          </select>
          <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="border rounded px-3 py-1">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={generatePayroll} disabled={generating} className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 disabled:opacity-50">
            {generating ? 'جاري الإنشاء...' : 'إنشاء كشوفات'}
          </button>
        </div>
      </div>

      {message && <div className={`px-4 py-3 rounded mb-4 ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        <div className="bg-blue-50 text-blue-700 p-3 rounded-lg shadow-sm text-center">
          <div className="text-sm opacity-80">الحصص المنجزة</div>
          <div className="text-xl font-bold">{totals.lessons}</div>
        </div>
        <div className="bg-purple-50 text-purple-700 p-3 rounded-lg shadow-sm text-center">
          <div className="text-sm opacity-80">إجمالي قيمة الحصص</div>
          <div className="text-xl font-bold">{totals.grossValue.toFixed(2)}</div>
        </div>
        <div className="bg-green-50 text-green-700 p-3 rounded-lg shadow-sm text-center">
          <div className="text-sm opacity-80">أرباح المعلمين</div>
          <div className="text-xl font-bold">{totals.teacherPay.toFixed(2)}</div>
        </div>
        <div className="bg-amber-50 text-amber-700 p-3 rounded-lg shadow-sm text-center">
          <div className="text-sm opacity-80">إيراد المعهد</div>
          <div className="text-xl font-bold">{totals.instituteRev.toFixed(2)}</div>
        </div>
        <div className="bg-red-50 text-red-700 p-3 rounded-lg shadow-sm text-center">
          <div className="text-sm opacity-80">خصومات المواصلات</div>
          <div className="text-xl font-bold">{totals.deductions.toFixed(2)}</div>
        </div>
        <div className="bg-indigo-50 text-indigo-700 p-3 rounded-lg shadow-sm text-center">
          <div className="text-sm opacity-80">صافي المدفوع</div>
          <div className="text-xl font-bold">{totals.finalPay.toFixed(2)}</div>
        </div>
      </div>

      {/* Summary from last generation */}
      {summary && (
        <div className="bg-gray-50 border rounded-lg p-4 mb-6">
          <h3 className="font-bold mb-2">ملخص آخر إنشاء:</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>عدد المعلمين: <strong>{summary.totalTeachers}</strong></div>
            <div>قيمة الحصص: <strong>{summary.totalLessonValue.toFixed(2)} د.ك</strong></div>
            <div>أرباح المعلمين: <strong>{summary.totalTeacherEarnings.toFixed(2)} د.ك</strong></div>
            <div>إيراد المعهد: <strong>{summary.totalInstituteRevenue.toFixed(2)} د.ك</strong></div>
            <div>خصومات: <strong>{summary.totalTransportDeductions.toFixed(2)} د.ك</strong></div>
            <div>صافي الرواتب: <strong>{summary.totalPayroll.toFixed(2)} د.ك</strong></div>
          </div>
        </div>
      )}

      {/* Records Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-sm">لا توجد كشوفات لهذا الشهر. اضغط "إنشاء كشوفات"</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-2 text-right">المعلم</th>
                <th className="p-2 text-right">#</th>
                <th className="p-2 text-right">الحصص</th>
                <th className="p-2 text-right">قيمة الحصص</th>
                <th className="p-2 text-right">أرباح المعلم</th>
                <th className="p-2 text-right">إيراد المعهد</th>
                <th className="p-2 text-right">النسبة</th>
                <th className="p-2 text-right">خصم مواصلات</th>
                <th className="p-2 text-right">الصافي</th>
                <th className="p-2 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, idx) => {
                const pct = r.totalLessonValue > 0 ? ((r.teacherEarnings / r.totalLessonValue) * 100).toFixed(0) : '0';
                return (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{r.teacher.user.firstName} {r.teacher.user.lastName}</td>
                    <td className="p-2 text-gray-500">{r.teacher.employeeId}</td>
                    <td className="p-2">{r.completedLessons}</td>
                    <td className="p-2">{r.totalLessonValue.toFixed(2)}</td>
                    <td className="p-2 text-green-700 font-medium">{r.teacherEarnings.toFixed(2)}</td>
                    <td className="p-2 text-amber-700 font-medium">{r.instituteRevenue.toFixed(2)}</td>
                    <td className="p-2 text-sm">{pct}% / {100 - parseInt(pct)}%</td>
                    <td className="p-2 text-red-600">{r.transportDeductions > 0 ? `${r.transportDeductions} د.ك` : '-'}</td>
                    <td className="p-2 font-bold">{r.finalAmount.toFixed(2)}</td>
                    <td className="p-2 text-center">
                      <button onClick={() => markPaid(r.id, r.paid)} className={`px-2 py-1 rounded text-xs ${r.paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {r.paid ? 'مدفوع' : 'غير مدفوع'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
