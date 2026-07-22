import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Clock,
  Landmark,
  Coins,
  FileSpreadsheet,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Info,
  ShieldAlert
} from 'lucide-react';
import React, { useState } from 'react';

import { transactionApi } from '../services/transactionApi';
import TransactionFormDialog from '../components/TransactionFormDialog';

import { studentApi } from '@/features/students/services/studentApi';
import { teacherApi } from '@/features/teachers/services/teacherApi';
import DataTable from '@/shared/components/DataTable/DataTable';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { formatDate } from '@/shared/utils/date';
import { formatMoney } from '@/shared/utils/money';

const TransactionsListPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' or 'reconciliation'
  const [formOpen, setFormOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', { page }],
    queryFn: () => transactionApi.getTransactions({ page, limit: 15 }),
    enabled: activeTab === 'transactions',
  });

  const { data: reconciliationData, refetch: refetchAudit, isLoading: isAuditLoading } = useQuery({
    queryKey: ['reconciliation-audit'],
    queryFn: transactionApi.getReconciliationAudit,
    enabled: activeTab === 'reconciliation',
  });

  const { data: studentsRes } = useQuery({
    queryKey: ['students-list-dropdown'],
    queryFn: () => studentApi.getAllStudents({ limit: 100 }),
  });

  const { data: teachersRes } = useQuery({
    queryKey: ['teachers-list-dropdown'],
    queryFn: () => teacherApi.getAllTeachers({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: transactionApi.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      setFormOpen(false);
    },
  });

  const handleSubmit = (formData) => {
    createMutation.mutate(formData);
  };

  const columns = [
    { header: 'المعرف', accessor: 'transactionId' },
    {
      header: 'التاريخ',
      cell: (row) => formatDate(row.date, 'yyyy/MM/dd'),
    },
    {
      header: 'النوع',
      cell: (row) => (
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
          row.type === 'STUDENT_PAYMENT' ? 'bg-success/15 text-success' :
          row.type === 'TEACHER_PAYMENT' ? 'bg-warning/15 text-warning' : 'bg-error/15 text-error'
        }`}>
          {row.type === 'STUDENT_PAYMENT' ? 'وارد (طالب)' : row.type === 'TEACHER_PAYMENT' ? 'صادر (معلم)' : 'مصروفات'}
        </span>
      ),
    },
    {
      header: 'البيان والتفاصيل',
      cell: (row) => {
        if (row.type === 'EXPENSE') return row.expenseItem;
        return row.name;
      },
    },
    {
      header: 'المبلغ',
      cell: (row) => (
        <span className={`font-bold ${row.type === 'STUDENT_PAYMENT' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {row.type === 'STUDENT_PAYMENT' ? '+' : '-'}{formatMoney(row.amount)}
        </span>
      ),
    },
    {
      header: 'طريقة الدفع',
      accessor: 'paymentMethod',
    },
    {
      header: 'المرجع',
      accessor: 'reference',
    },
    {
      header: 'الرصيد المتبقي (Live)',
      cell: (row) => (
        <span className="font-bold text-primary">
          {formatMoney(row.remainingBalance || 0)}
        </span>
      ),
    },
  ];

  const latestTxn = data?.data?.[0];
  const liveCashBalance = latestTxn ? latestTxn.remainingBalance : 0;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <PageHeader title="دفتر الأستاذ والحركات المالية" description="المتابعة المركزية للواردات، الصادرات، ومصاريف الأكاديمية">
        <div className="flex gap-2">
          {activeTab === 'transactions' && (
            <Button onClick={() => setFormOpen(true)} className="gap-2 button-premium-hover">
              <Plus className="h-4 w-4" />
              تسجيل حركة مالية
            </Button>
          )}
          {activeTab === 'reconciliation' && (
            <Button
              variant="outline"
              onClick={() => refetchAudit()}
              disabled={isAuditLoading}
              className="gap-2 button-premium-hover"
            >
              <RefreshCw className={`h-4 w-4 ${isAuditLoading ? 'animate-spin' : ''}`} />
              إعادة فحص المطابقة
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Modern High-Fidelity Tab Bar */}
      <div className="flex border-b border-border gap-2 select-none">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2.5 text-sm font-black transition-all border-b-2 -mb-[2px] ${
            activeTab === 'transactions'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          حركات اليومية والقيود المالية
        </button>
        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`px-4 py-2.5 text-sm font-black transition-all border-b-2 -mb-[2px] flex items-center gap-2 ${
            activeTab === 'reconciliation'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          التدقيق والمطابقة الحسابية الذاتية
        </button>
      </div>

      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Live Financial Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-r-4 border-r-primary bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
                  <span>رصيد الخزينة الحالي (Live)</span>
                  <Landmark className="h-4 w-4 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-primary">{formatMoney(liveCashBalance)}</div>
                <p className="text-xs text-muted-foreground mt-1">الرصيد التراكمي المتبقي بالخزينة</p>
              </CardContent>
            </Card>

            <Card className="border-r-4 border-r-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
                  <span>إجمالي المقبوضات الحالية</span>
                  <Coins className="h-4 w-4 text-green-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatMoney((data?.data?.filter(t => t.type === 'STUDENT_PAYMENT').reduce((s, t) => s + t.amount, 0)) || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">المقبوضات الظاهرة بالصفحة الحالية</p>
              </CardContent>
            </Card>

            <Card className="border-r-4 border-r-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
                  <span>إجمالي المصروفات الحالية</span>
                  <FileSpreadsheet className="h-4 w-4 text-red-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatMoney((data?.data?.filter(t => t.type !== 'STUDENT_PAYMENT').reduce((s, t) => s + t.amount, 0)) || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">المصاريف والرواتب بالصفحة الحالية</p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-card p-4 border border-border rounded-xl">
            <DataTable
              columns={columns}
              data={data?.data || []}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          {isAuditLoading ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl bg-card text-muted-foreground gap-3 animate-pulse">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <span className="font-bold text-sm">جاري مراجعة القيود وتشغيل فحص المطابقة المالي...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Audit Summary Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className={`border-r-4 ${reconciliationData?.summary?.ledgerIsBalanced ? 'border-r-emerald-500' : 'border-r-rose-500'}`}>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs text-muted-foreground font-black">حالة التوازن المحاسبي</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      {reconciliationData?.summary?.ledgerIsBalanced ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          <span className="font-bold text-sm text-emerald-600">متوازن 100%</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-5 w-5 text-rose-500 animate-pulse" />
                          <span className="font-bold text-sm text-rose-600">غير متطابق ماليًا</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      مقارنة مجموع حركات المدين ({formatMoney(reconciliationData?.summary?.totalDebits || 0)}) والدائن ({formatMoney(reconciliationData?.summary?.totalCredits || 0)})
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-r-4 border-r-blue-500">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs text-muted-foreground font-black">السجلات المدققة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                      {reconciliationData?.summary?.ledgerEntriesAudited || 0} قيد
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">حجم قيود دفتر اليومية الخاضعة للمراجعة الحية</p>
                  </CardContent>
                </Card>

                <Card className={`border-r-4 ${reconciliationData?.summary?.hourDiscrepancyCount === 0 ? 'border-r-emerald-500' : 'border-r-amber-500'}`}>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs text-muted-foreground font-black">نزاهة ساعات الطلاب</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-2xl font-black flex items-center gap-2">
                      <span className={reconciliationData?.summary?.hourDiscrepancyCount === 0 ? 'text-emerald-600' : 'text-amber-600'}>
                        {reconciliationData?.summary?.hourDiscrepancyCount || 0} فروقات
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">مطابقة السجلات الفعلية لحركات الرصيد مقابل المدفوعات المستلمة</p>
                  </CardContent>
                </Card>

                <Card className={`border-r-4 ${reconciliationData?.summary?.totalAnomaliesFound === 0 ? 'border-r-emerald-500' : 'border-r-error'}`}>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs text-muted-foreground font-black">مؤشر المخاطر والعمليات الشاذة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-black flex items-center gap-2 ${reconciliationData?.summary?.totalAnomaliesFound === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {reconciliationData?.summary?.totalAnomaliesFound === 0 ? (
                        <>
                          <ShieldCheck className="h-5 w-5 text-emerald-500" />
                          <span>0 مخاطر</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="h-5 w-5 text-rose-500 animate-bounce" />
                          <span>{reconciliationData?.summary?.totalAnomaliesFound} تنبيهات</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">مؤشرات دفع مستندات مكررة أو خصومات مفرطة</p>
                  </CardContent>
                </Card>
              </div>

              {/* Mismatched Student Hour Balances Section */}
              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    تقرير مطابقة ساعات الطلاب المستهلكة (Student Hour Discrepancies)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {reconciliationData?.hourAnomalies?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-muted/40 font-black">
                          <tr>
                            <th className="p-3">الطالب</th>
                            <th className="p-3">المادة</th>
                            <th className="p-3">الرصيد الفعلي بقاعدة البيانات</th>
                            <th className="p-3">مجموع حركات الشراء المالي</th>
                            <th className="p-3">فرق الساعات</th>
                            <th className="p-3">الحالة والخطورة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reconciliationData.hourAnomalies.map((item, idx) => (
                            <tr key={idx} className="border-b border-border/50 hover:bg-muted/10">
                              <td className="p-3 font-bold text-foreground">{item.studentName}</td>
                              <td className="p-3">{item.subject}</td>
                              <td className="p-3 font-black">{item.remainingHours} ساعة</td>
                              <td className="p-3 text-muted-foreground">{item.expectedRemaining} ساعة</td>
                              <td className="p-3 text-rose-600 font-bold">-{item.discrepancy} ساعة</td>
                              <td className="p-3">
                                <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  تعديل غير معتمد بالدفتر الحسابي
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                      <p className="text-xs font-bold">100% تطابق تام! جميع ساعات الطلاب المستهلكة مطابقة ماليًا ومثبتة بحركات السجل.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* System Anomalies Report */}
              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-rose-500" />
                    كاشف العمليات الحسابية الشاذة والمخاطر التشغيلية (Anomaly Detection Log)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {reconciliationData?.anomalies?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-muted/40 font-black">
                          <tr>
                            <th className="p-3">نوع التنبيه</th>
                            <th className="p-3">الخطورة</th>
                            <th className="p-3">البيان والتفاصيل الحيوية</th>
                            <th className="p-3">التاريخ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reconciliationData.anomalies.map((item, idx) => (
                            <tr key={idx} className="border-b border-border/50 hover:bg-muted/10">
                              <td className="p-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                                  item.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {item.type}
                                </span>
                              </td>
                              <td className="p-3 font-bold text-rose-600">{item.severity}</td>
                              <td className="p-3 text-foreground font-semibold">{item.message}</td>
                              <td className="p-3 text-muted-foreground">{formatDate(item.date, 'yyyy/MM/dd')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                      <p className="text-xs font-bold">لا يوجد أي حركات شاذة أو فواتير مكررة. جميع القيود تتطابق مع لوائح النزاهة المالية للأكاديمية.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      <TransactionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        students={studentsRes?.data || []}
        teachers={teachersRes?.data || []}
      />
    </div>
  );
};

export default TransactionsListPage;
