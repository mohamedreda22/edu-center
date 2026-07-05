'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Student {
  id: string;
  studentId: string;
  monthlyFee: number;
  status: string;
  grade: string;
  user: { firstName: string; lastName: string; phone: string };
  _count: { lessons: number; payments: number };
}

interface Payment {
  id: string;
  studentId: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: string;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
  student: {
    id: string;
    studentId: string;
    monthlyFee: number;
    user: { firstName: string; lastName: string };
  };
}

export default function PaymentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentPayments, setStudentPayments] = useState<Payment[]>([]);
  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    dueDate: '',
    paidDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'نقداً',
    notes: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({ totalStudents: 0, paid: 0, partial: 0, unpaid: 0, totalCollected: 0 });

  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, pRes] = await Promise.all([
        fetch(`/api/students?limit=1000`),
        fetch(`/api/payments?month=${selectedMonth}&year=${selectedYear}`),
      ]);
      const sData = await sRes.json();
      const pData = await pRes.json();
      setStudents(sData.students || []);
      setPayments(pData.payments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const activeStudents = students.filter(s => s.status === 'ACTIVE');
    let paid = 0, partial = 0, unpaid = 0, totalCollected = 0;
    activeStudents.forEach(student => {
      const studentPayments = payments.filter(p => p.studentId === student.id);
      const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
      totalCollected += totalPaid;
      if (student.monthlyFee <= 0) { paid++; return; }
      if (totalPaid >= student.monthlyFee) paid++;
      else if (totalPaid > 0) partial++;
      else unpaid++;
    });
    setStats({
      totalStudents: activeStudents.length,
      paid, partial, unpaid, totalCollected,
    });
  }, [students, payments]);

  const getStudentStatus = (student: Student) => {
    if (student.monthlyFee <= 0) return { label: 'بدون رسوم', color: 'bg-gray-100 text-gray-600', icon: '⬜' };
    const sp = payments.filter(p => p.studentId === student.id);
    const totalPaid = sp.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid >= student.monthlyFee) return { label: 'مسدد', color: 'bg-green-100 text-green-700', icon: '🟢' };
    if (totalPaid > 0) return { label: 'مسدد جزئياً', color: 'bg-yellow-100 text-yellow-700', icon: '🟡' };
    return { label: 'غير مسدد', color: 'bg-red-100 text-red-700', icon: '🔴' };
  };

  const getStudentTotalPaid = (student: Student) => {
    return payments.filter(p => p.studentId === student.id).reduce((sum, p) => sum + p.amount, 0);
  };

  const getStudentRemaining = (student: Student) => {
    const paid = getStudentTotalPaid(student);
    return Math.max(0, student.monthlyFee - paid);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: formData.studentId,
          amount: parseFloat(formData.amount),
          dueDate: formData.dueDate || new Date().toISOString().split('T')[0],
          paidDate: formData.paidDate || null,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess('تم تسجيل الدفعة بنجاح');
      setShowAddModal(false);
      setFormData({ studentId: '', amount: '', dueDate: '', paidDate: new Date().toISOString().split('T')[0], paymentMethod: 'نقداً', notes: '' });
      fetchData();
    } catch (err) { setError('فشل الاتصال بالخادم'); }
  };

  const viewHistory = async (student: Student) => {
    setSelectedStudent(student);
    try {
      const res = await fetch(`/api/payments?studentId=${student.id}`);
      const data = await res.json();
      setStudentPayments(data.payments || []);
      setShowHistoryModal(true);
    } catch (err) { console.error(err); }
  };

  const deletePayment = async (paymentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدفعة؟')) return;
    try {
      const res = await fetch(`/api/payments/${paymentId}`, { method: 'DELETE' });
      if (res.ok) {
        setStudentPayments(prev => prev.filter(p => p.id !== paymentId));
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const filteredStudents = students.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.studentId.toLowerCase().includes(q) ||
      s.user.firstName.toLowerCase().includes(q) ||
      s.user.lastName.toLowerCase().includes(q) ||
      s.user.phone.includes(q);
  });

  const exportInvoice = (payment: Payment) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html dir="rtl" lang="ar"><head><title>فاتورة</title>
      <style>body{font-family:system-ui;padding:40px;max-width:700px;margin:auto}
        h1{text-align:center;color:#1e40af}
        .header{text-align:center;margin-bottom:30px}
        table{width:100%;border-collapse:collapse;margin:20px 0}
        th,td{border:1px solid #ccc;padding:10px;text-align:right}
        th{background:#f3f4f6}
        .total{font-size:18px;font-weight:bold;text-align:left;margin-top:20px}
        .footer{text-align:center;margin-top:40px;color:#666;font-size:14px}
        .paid{color:#16a34a;font-weight:bold}
      </style></head><body>
        <h1>معهد ألفا العالمي</h1>
        <p class="header">Alpha International Institute<br>فاتورة دفع</p>
        <table>
          <tr><th>رقم الفاتورة</th><td>INV-${payment.id.slice(-8)}</td></tr>
          <tr><th>الطالب</th><td>${payment.student.user.firstName} ${payment.student.user.lastName}</td></tr>
          <tr><th>المبلغ</th><td>${payment.amount} د.ك</td></tr>
          <tr><th>طريقة الدفع</th><td>${payment.paymentMethod || '-'}</td></tr>
          <tr><th>تاريخ الدفع</th><td>${payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('ar-KW') : '-'}</td></tr>
          <tr><th>تاريخ الاستحقاق</th><td>${new Date(payment.dueDate).toLocaleDateString('ar-KW')}</td></tr>
          <tr><th>الحالة</th><td class="paid">${payment.status === 'PAID' ? 'مدفوع ✅' : payment.status === 'PARTIALLY_PAID' ? 'مدفوع جزئياً' : 'معلق'}</td></tr>
        </table>
        ${payment.notes ? `<p><strong>ملاحظات:</strong> ${payment.notes}</p>` : ''}
        <div class="total">الإجمالي: ${payment.amount} د.ك</div>
        <div class="footer">شكراً لثقتكم بمعهد ألفا العالمي</div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">المدفوعات</h1>
        <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + تسجيل دفعة
        </button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: 'إجمالي الطلاب', value: stats.totalStudents, color: 'bg-blue-50 text-blue-700', icon: '👥' },
          { label: 'مسدد بالكامل', value: stats.paid, color: 'bg-green-50 text-green-700', icon: '🟢' },
          { label: 'مسدد جزئياً', value: stats.partial, color: 'bg-yellow-50 text-yellow-700', icon: '🟡' },
          { label: 'غير مسدد', value: stats.unpaid, color: 'bg-red-50 text-red-700', icon: '🔴' },
          { label: 'المجموع المحصل', value: `${stats.totalCollected.toFixed(2)} د.ك`, color: 'bg-purple-50 text-purple-700', icon: '💰' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.color} p-4 rounded-lg shadow-sm`}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-sm opacity-80">{stat.label}</div>
            <div className="text-xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex gap-4 items-center">
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
        <div className="flex-1">
          <input type="text" placeholder="بحث عن طالب..." value={search} onChange={e => setSearch(e.target.value)} className="border rounded px-3 py-1 w-full" />
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 text-right">#</th>
                <th className="p-3 text-right">الطالب</th>
                <th className="p-3 text-right">الهاتف</th>
                <th className="p-3 text-right">الصف</th>
                <th className="p-3 text-right">الرسوم الشهرية</th>
                <th className="p-3 text-right">المدفوع</th>
                <th className="p-3 text-right">المتبقي</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr><td colSpan={9} className="p-6 text-center text-gray-500">لا يوجد طلاب</td></tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const status = getStudentStatus(student);
                  const totalPaid = getStudentTotalPaid(student);
                  const remaining = getStudentRemaining(student);
                  return (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{idx + 1}</td>
                      <td className="p-3 font-medium">{student.user.firstName} {student.user.lastName}</td>
                      <td className="p-3 text-gray-600">{student.user.phone}</td>
                      <td className="p-3">{student.grade || '-'}</td>
                      <td className="p-3 font-medium">{student.monthlyFee > 0 ? `${student.monthlyFee} د.ك` : '-'}</td>
                      <td className="p-3 text-green-600 font-medium">{totalPaid > 0 ? `${totalPaid.toFixed(2)} د.ك` : '-'}</td>
                      <td className="p-3 text-red-600 font-medium">{remaining > 0 ? `${remaining.toFixed(2)} د.ك` : '-'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-sm ${status.color}`}>
                          {status.icon} {status.label}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => viewHistory(student)} className="text-blue-600 hover:text-blue-800 ml-2 text-sm">
                          السجل
                        </button>
                        <button onClick={() => { setFormData(prev => ({ ...prev, studentId: student.id })); setShowAddModal(true); }} className="text-green-600 hover:text-green-800 text-sm">
                          إضافة دفعة
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">تسجيل دفعة جديدة</h2>
            <form onSubmit={handleAddPayment}>
              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">الطالب</label>
                <select value={formData.studentId} onChange={e => setFormData(prev => ({ ...prev, studentId: e.target.value }))} className="w-full border rounded px-3 py-2" required>
                  <option value="">اختر طالباً</option>
                  {students.filter(s => s.status === 'ACTIVE').map(s => (
                    <option key={s.id} value={s.id}>{s.user.firstName} {s.user.lastName} ({s.studentId})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">المبلغ</label>
                  <input type="number" step="0.001" value={formData.amount} onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))} className="w-full border rounded px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">طريقة الدفع</label>
                  <select value={formData.paymentMethod} onChange={e => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))} className="w-full border rounded px-3 py-2">
                    <option value="نقداً">نقداً</option>
                    <option value="بطاقة ائتمان">بطاقة ائتمان</option>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="شيك">شيك</option>
                    <option value="أونلاين">أونلاين</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">تاريخ الدفع</label>
                  <input type="date" value={formData.paidDate} onChange={e => setFormData(prev => ({ ...prev, paidDate: e.target.value }))} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">تاريخ الاستحقاق</label>
                  <input type="date" value={formData.dueDate} onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))} className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">ملاحظات</label>
                <textarea value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))} className="w-full border rounded px-3 py-2" rows={2} />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">تسجيل</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showHistoryModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowHistoryModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">سجل مدفوعات: {selectedStudent.user.firstName} {selectedStudent.user.lastName}</h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-blue-50 p-3 rounded text-center">
                <div className="text-sm text-gray-600">الرسوم الشهرية</div>
                <div className="text-lg font-bold">{selectedStudent.monthlyFee} د.ك</div>
              </div>
              <div className="bg-green-50 p-3 rounded text-center">
                <div className="text-sm text-gray-600">المجموع المدفوع</div>
                <div className="text-lg font-bold text-green-700">{studentPayments.reduce((s, p) => s + p.amount, 0).toFixed(2)} د.ك</div>
              </div>
              <div className="bg-red-50 p-3 rounded text-center">
                <div className="text-sm text-gray-600">المتبقي</div>
                <div className="text-lg font-bold text-red-700">{Math.max(0, selectedStudent.monthlyFee - studentPayments.reduce((s, p) => s + p.amount, 0)).toFixed(2)} د.ك</div>
              </div>
            </div>
            {studentPayments.length === 0 ? (
              <p className="text-center text-gray-500 py-6">لا توجد مدفوعات مسجلة</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-2 text-right">#</th>
                    <th className="p-2 text-right">المبلغ</th>
                    <th className="p-2 text-right">طريقة الدفع</th>
                    <th className="p-2 text-right">تاريخ الدفع</th>
                    <th className="p-2 text-right">تاريخ الاستحقاق</th>
                    <th className="p-2 text-right">ملاحظات</th>
                    <th className="p-2 text-center">فاتورة</th>
                    <th className="p-2 text-center">حذف</th>
                  </tr>
                </thead>
                <tbody>
                  {studentPayments.map((p, idx) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2 font-medium">{p.amount} د.ك</td>
                      <td className="p-2">{p.paymentMethod || '-'}</td>
                      <td className="p-2">{p.paidDate ? new Date(p.paidDate).toLocaleDateString('ar-KW') : '-'}</td>
                      <td className="p-2">{new Date(p.dueDate).toLocaleDateString('ar-KW')}</td>
                      <td className="p-2 text-sm text-gray-500">{p.notes || '-'}</td>
                      <td className="p-2 text-center">
                        <button onClick={() => exportInvoice(p)} className="text-blue-600 hover:text-blue-800 text-sm">طباعة</button>
                      </td>
                      <td className="p-2 text-center">
                        <button onClick={() => deletePayment(p.id)} className="text-red-600 hover:text-red-800 text-sm">حذف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
