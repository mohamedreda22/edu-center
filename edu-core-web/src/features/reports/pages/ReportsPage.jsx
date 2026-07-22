import { useQuery } from '@tanstack/react-query';
import {
  Download,
  FileText,
  BarChart3,
  Scale,
  Wallet,
  TrendingUp,
  HelpCircle,
  Sliders,
  TrendingDown,
  CheckCircle2
} from 'lucide-react';
import React, { useState } from 'react';

import { reportsApi } from '../services/reportsApi';

import { studentApi } from '@/features/students/services/studentApi';
import { teacherApi } from '@/features/teachers/services/teacherApi';
import DataTable from '@/shared/components/DataTable/DataTable';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/shared/components/ui/card';
import { formatMoney } from '@/shared/utils/money';

const ReportsPage = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportType, setReportType] = useState('teacher'); // 'teacher', 'subject', 'level', 'student_financial', 'teacher_financial', 'financial_statements', 'predictive_analytics'
  const [growthRate, setGrowthRate] = useState(1.0); // Interactive scenario multiplier

  // Standard Performance Reports
  const { data: teacherData, isLoading: loadingTeacher } = useQuery({
    queryKey: ['reports-by-teacher', { month, year }],
    queryFn: () => reportsApi.getByTeacher({ month, year }),
    enabled: reportType === 'teacher',
  });

  const { data: subjectData, isLoading: loadingSubject } = useQuery({
    queryKey: ['reports-by-subject', { month, year }],
    queryFn: () => reportsApi.getBySubject({ month, year }),
    enabled: reportType === 'subject',
  });

  const { data: levelData, isLoading: loadingLevel } = useQuery({
    queryKey: ['reports-by-level', { month, year }],
    queryFn: () => reportsApi.getByLevel({ month, year }),
    enabled: reportType === 'level',
  });

  // Comprehensive Live Student Financial Report
  const { data: studentsRes, isLoading: loadingStudents } = useQuery({
    queryKey: ['reports-students-financial'],
    queryFn: () => studentApi.getAllStudents({ limit: 100 }),
    enabled: reportType === 'student_financial',
  });

  // Comprehensive Live Teacher Financial Report
  const { data: teachersRes, isLoading: loadingTeachers } = useQuery({
    queryKey: ['reports-teachers-financial'],
    queryFn: () => teacherApi.getAllTeachers({ limit: 100 }),
    enabled: reportType === 'teacher_financial',
  });

  // Dynamic Double-Entry Financial Statements Report
  const { data: financialStatementsRes, isLoading: loadingStatements } = useQuery({
    queryKey: ['reports-financial-statements'],
    queryFn: () => reportsApi.getFinancialStatements(),
    enabled: reportType === 'financial_statements',
  });

  // Interactive Predictive Analytics Report
  const { data: predictiveRes, isLoading: loadingPredictive } = useQuery({
    queryKey: ['reports-predictive-analytics', growthRate],
    queryFn: () => reportsApi.getPredictiveAnalytics(growthRate),
    enabled: reportType === 'predictive_analytics',
  });

  const handleExportCSV = async () => {
    const data = await reportsApi.exportCSV({ month, year });
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report-${month}-${year}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleExportPDF = async () => {
    const data = await reportsApi.exportPDF({ month, year });
    const url = window.URL.createObjectURL(
      new Blob([data], { type: 'application/pdf' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report-${month}-${year}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const setToThisMonth = () => {
    const now = new Date();
    setMonth(now.getMonth() + 1);
    setYear(now.getFullYear());
  };

  const setToLastMonth = () => {
    const now = new Date();
    let m = now.getMonth();
    let y = now.getFullYear();
    if (m === 0) {
      m = 12;
      y -= 1;
    }
    setMonth(m);
    setYear(y);
  };

  const setToThisYear = () => {
    const now = new Date();
    setYear(now.getFullYear());
  };

  const teacherPerformanceColumns = [
    { header: 'المعلم', accessor: 'teacherName' },
    { header: 'عدد الحصص', accessor: 'totalLessons' },
    {
      header: 'إجمالي القيمة',
      cell: (row) => formatMoney(row.grossValue),
    },
    {
      header: 'نصيب المعلم',
      cell: (row) => formatMoney(row.teacherShare),
    },
    {
      header: 'نصيب المعهد',
      cell: (row) => formatMoney(row.instituteShare),
    },
  ];

  const subjectColumns = [
    { header: 'المادة', accessor: '_id' },
    { header: 'عدد الحصص', accessor: 'totalLessons' },
    {
      header: 'إجمالي القيمة',
      cell: (row) => formatMoney(row.grossValue),
    },
  ];

  const levelColumns = [
    { header: 'المرحلة الدراسية', accessor: '_id' },
    { header: 'عدد الحصص', accessor: 'totalLessons' },
    {
      header: 'إجمالي القيمة',
      cell: (row) => formatMoney(row.grossValue),
    },
  ];

  // Student Report Columns
  const studentFinancialColumns = [
    { header: 'كود الطالب', accessor: 'studentCode' },
    { header: 'اسم الطالب / ولي الأمر', accessor: 'parentName' },
    { header: 'المرحلة الدراسية', accessor: 'grade' },
    { header: 'الساعات المشتراة', accessor: 'totalBalance' },
    { header: 'الساعات المستهلكة', accessor: 'totalConsumed' },
    { header: 'الساعات المتبقية', accessor: 'remainingHours' },
    {
      header: 'المبالغ المدفوعة',
      cell: (row) => formatMoney(row.totalPaid || 0),
    },
    {
      header: 'المبالغ المتبقية',
      cell: (row) => formatMoney(row.remainingAmount || 0),
    },
    {
      header: 'حالة السداد (Status)',
      cell: (row) => (
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
            row.paymentStatus === 'Fully Paid'
              ? 'bg-success/15 text-success'
              : row.paymentStatus === 'Partially Paid'
                ? 'bg-warning/15 text-warning'
                : 'bg-error/15 text-error'
          }`}
        >
          {row.paymentStatus}
        </span>
      ),
    },
    {
      header: 'تنبيه الرصيد (Alerts)',
      cell: (row) => (
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
            row.balanceAlert === 'OK'
              ? 'bg-success/15 text-success'
              : 'bg-error/15 text-error'
          }`}
        >
          {row.balanceAlert}
        </span>
      ),
    },
  ];

  // Teacher Report Columns
  const teacherFinancialColumns = [
    { header: 'كود الموظف', accessor: 'employeeCode' },
    {
      header: 'المعلم',
      cell: (row) =>
        `${row.userId?.firstName || ''} ${row.userId?.lastName || ''}`,
    },
    {
      header: 'ساعات منفذة',
      cell: (row) => `${row.metrics?.executedHours || 0} ساعة`,
    },
    {
      header: 'الاستحقاق الإجمالي (Gross)',
      cell: (row) => formatMoney(row.metrics?.dueBeforeDeduction || 0),
    },
    {
      header: 'خصم السيارة',
      cell: (row) => formatMoney(row.metrics?.transportationDeduction || 0),
    },
    {
      header: 'صافي المستحق (Net)',
      cell: (row) => formatMoney(row.metrics?.netDue || 0),
    },
    {
      header: 'المبالغ المصروفة (Paid)',
      cell: (row) => formatMoney(row.metrics?.paidToTeacher || 0),
    },
    {
      header: 'المستحق المعلق (Remaining)',
      cell: (row) => (
        <span className="font-bold text-red-600 dark:text-red-400">
          {formatMoney(row.metrics?.remainingDue || 0)}
        </span>
      ),
    },
  ];

  const getActiveData = () => {
    if (reportType === 'teacher') {
      return {
        data: teacherData?.data || [],
        columns: teacherPerformanceColumns,
        loading: loadingTeacher,
      };
    }
    if (reportType === 'subject') {
      return {
        data: subjectData?.data || [],
        columns: subjectColumns,
        loading: loadingSubject,
      };
    }
    if (reportType === 'level') {
      return {
        data: levelData?.data || [],
        columns: levelColumns,
        loading: loadingLevel,
      };
    }
    if (reportType === 'student_financial') {
      return {
        data: studentsRes?.data || [],
        columns: studentFinancialColumns,
        loading: loadingStudents,
      };
    }
    if (reportType === 'teacher_financial') {
      return {
        data: teachersRes?.data || [],
        columns: teacherFinancialColumns,
        loading: loadingTeachers,
      };
    }
    return { data: [], columns: [], loading: false };
  };

  const { data, columns, loading } = getActiveData();

  const isFinancialReport =
    reportType === 'student_financial' || reportType === 'teacher_financial';
  const isStatementsReport = reportType === 'financial_statements';
  const isPredictiveReport = reportType === 'predictive_analytics';

  const statements = financialStatementsRes?.data || {};
  const incomeStatement = statements.incomeStatement || {
    revenue: {},
    expenses: {},
    netIncome: 0,
  };
  const balanceSheet = statements.balanceSheet || {
    assets: [],
    liabilities: [],
    equity: [],
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
  };
  const cashFlow = statements.cashFlowStatement || {
    inflows: 0,
    outflows: 0,
    netCashFlow: 0,
  };

  const predictiveData = predictiveRes || { forecasts: [] };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <PageHeader
        title="تقارير الأداء والبيانات المالية"
        description="تحليل الإيرادات، مصروفات التشغيل ومستحقات المعلمين والتحليلات التنبؤية المتكاملة."
      >
        <div className="flex flex-wrap gap-2 justify-end">
          {!isFinancialReport && !isStatementsReport && !isPredictiveReport && (
            <div className="flex gap-1 border border-border rounded-md p-1 bg-muted/50">
              <Button variant="ghost" size="sm" onClick={setToThisMonth}>
                الشهر الحالي
              </Button>
              <Button variant="ghost" size="sm" onClick={setToLastMonth}>
                الشهر الماضي
              </Button>
              <Button variant="ghost" size="sm" onClick={setToThisYear}>
                السنة الحالية
              </Button>
            </div>
          )}
          {!isFinancialReport && !isStatementsReport && !isPredictiveReport && (
            <>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="ml-2 h-4 w-4" />
                تصدير CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <FileText className="ml-2 h-4 w-4" />
                تصدير PDF
              </Button>
            </>
          )}
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="h-9 border border-border rounded-md px-2 text-sm font-semibold bg-background"
          >
            <option value="teacher">حصص المعلم وأدائه</option>
            <option value="subject">أداء المواد الدراسية</option>
            <option value="level">أداء المراحل التعليمية</option>
            <option value="student_financial">
              تقرير الطلاب المالي والتعليمي (كشف كامل)
            </option>
            <option value="teacher_financial">
              تقرير المعلمين المالي الشامل (كشف مستحقات)
            </option>
            <option value="financial_statements">
              القوائم المالية المزدوجة (SaaS Double-Entry)
            </option>
            <option value="predictive_analytics">
              التحليلات والمؤشرات التنبؤية (Forecasting & Scenario Simulator)
            </option>
          </select>
          {!isFinancialReport && !isStatementsReport && !isPredictiveReport && (
            <>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="h-9 border border-border rounded-md px-2 bg-background"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="h-9 border border-border rounded-md px-2 bg-background"
              >
                {[2023, 2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </PageHeader>

      {isStatementsReport ? (
        <div className="space-y-6">
          {loadingStatements ? (
            <div className="flex justify-center p-12">
              <span className="text-muted-foreground animate-pulse font-black text-sm">
                جاري تحميل القوائم المالية المزدوجة...
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Income Statement */}
              <Card className="border-r-4 border-r-primary">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    قائمة الدخل (Income Statement)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">
                      {incomeStatement.revenue?.name || 'إيرادات الرسوم'}:
                    </span>
                    <span className="font-bold text-green-600">
                      {formatMoney(incomeStatement.revenue?.amount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">
                      {incomeStatement.expenses?.name || 'المصروفات التشغيلية'}:
                    </span>
                    <span className="font-bold text-red-600">
                      {formatMoney(incomeStatement.expenses?.amount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 text-base font-bold bg-primary/5 p-2 rounded">
                    <span>صافي الأرباح (Net Income):</span>
                    <span
                      className={
                        incomeStatement.netIncome >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {formatMoney(incomeStatement.netIncome || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Balance Sheet */}
              <Card className="border-r-4 border-r-green-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Scale className="h-5 w-5 text-green-500" />
                    الميزانية العمومية (Balance Sheet)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="space-y-2 border-b pb-2">
                    <span className="font-bold block text-xs text-muted-foreground">
                      الأصول (Assets)
                    </span>
                    {balanceSheet.assets?.map((asset, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span>{asset.name}:</span>
                        <span className="font-semibold">
                          {formatMoney(asset.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs font-bold pt-1 border-t">
                      <span>إجمالي الأصول (Total Assets):</span>
                      <span className="text-green-600">
                        {formatMoney(balanceSheet.totalAssets)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 border-b pb-2">
                    <span className="font-bold block text-xs text-muted-foreground">
                      الالتحامات (Liabilities)
                    </span>
                    {balanceSheet.liabilities?.map((lib, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span>{lib.name}:</span>
                        <span className="font-semibold">
                          {formatMoney(lib.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs font-bold pt-1 border-t">
                      <span>إجمالي الالتزامات:</span>
                      <span className="text-red-600">
                        {formatMoney(balanceSheet.totalLiabilities)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold block text-xs text-muted-foreground">
                      حقوق الملكية (Equity)
                    </span>
                    {balanceSheet.equity?.map((eq, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span>{eq.name}:</span>
                        <span className="font-semibold">
                          {formatMoney(eq.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs font-bold pt-1 border-t">
                      <span>إجمالي حقوق الملكية & الالتزامات:</span>
                      <span className="text-primary">
                        {formatMoney(
                          balanceSheet.totalLiabilities +
                            balanceSheet.totalEquity
                        )}
                      </span>
                    </div>
                  </div>

                  {balanceSheet.totalAssets ===
                  balanceSheet.totalLiabilities + balanceSheet.totalEquity ? (
                    <div className="text-center bg-success/15 text-success text-xs py-1.5 rounded font-bold">
                      ✓ الحسابات متوازنة تماماً (Assets = Liabilities + Equity)
                    </div>
                  ) : (
                    <div className="text-center bg-error/15 text-error text-xs py-1.5 rounded font-bold">
                      ⚠️ فروقات تسوية في دفتر الأستاذ المالي
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cash Flow Statement */}
              <Card className="border-r-4 border-r-amber-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-amber-500" />
                    قائمة التدفقات النقدية (Cash Flow)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">
                      المتحصلات والتدفقات الداخلة (Inflows):
                    </span>
                    <span className="font-bold text-green-600">
                      {formatMoney(cashFlow.inflows || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">
                      المدفوعات والتدفقات الخارجة (Outflows):
                    </span>
                    <span className="font-bold text-red-600">
                      {formatMoney(cashFlow.outflows || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 text-base font-bold bg-amber-50 p-2 rounded">
                    <span>صافي التدفقات النقدية:</span>
                    <span
                      className={
                        cashFlow.netCashFlow >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {formatMoney(cashFlow.netCashFlow || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : isPredictiveReport ? (
        <div className="space-y-6">
          {/* Scenario Slider Control Panel */}
          <Card className="border-r-4 border-r-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-black flex items-center gap-2 text-primary">
                <Sliders className="h-5 w-5" />
                محاكي نمو الاشتراكات وسيناريوهات التدفق المالي (Predictive Growth Scenario Simulator)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                اسحب المؤشر لأسفل أو لأعلى لمحاكاة تأثير معدلات نمو اشتراكات الطلاب الجديدة على الإيرادات والأرباح الصافية المتوقعة للمعهد خلال الـ 6 أشهر القادمة.
              </p>
              <div className="flex flex-col md:flex-row items-center gap-6 bg-surface p-4 rounded-xl border border-border">
                <div className="flex-1 w-full space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-red-500 flex items-center gap-1"><TrendingDown className="h-3.5 w-3.5" /> متحفظ (50%)</span>
                    <span className="text-primary">معدل النمو الحالي (100%)</span>
                    <span className="text-green-500 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> متفائل طموح (150%)</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={growthRate}
                    onChange={(e) => setGrowthRate(parseFloat(e.target.value))}
                    className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
                <div className="bg-card px-6 py-3 border border-border rounded-xl text-center shadow-premium-sm min-w-[150px] shrink-0">
                  <span className="text-[10px] text-muted-foreground font-bold block mb-1">مؤشر المحاكاة</span>
                  <span className="text-2xl font-black text-primary">{Math.round(growthRate * 100)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {loadingPredictive ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl bg-card text-muted-foreground gap-3 animate-pulse">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <span className="font-bold text-sm">جاري مراجعة النماذج الحسابية ورسم التوقعات المالية...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Projections Graph Card */}
              <Card className="lg:col-span-2 p-5 md:p-6 space-y-4">
                <CardHeader className="p-0 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    المنحنى التنبؤي المتوقع للإيرادات والمصروفات والأرباح (6-Month Projection Line)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-64 flex items-end justify-center relative bg-surface p-2 rounded-xl border border-border">
                  <svg className="w-full h-full" viewBox="0 0 600 200">
                    <defs>
                      <linearGradient id="gradProj" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Grid Lines */}
                    <line x1="50" y1="30" x2="550" y2="30" stroke="hsl(var(--border))" strokeDasharray="3,3" />
                    <line x1="50" y1="80" x2="550" y2="80" stroke="hsl(var(--border))" strokeDasharray="3,3" />
                    <line x1="50" y1="130" x2="550" y2="130" stroke="hsl(var(--border))" strokeDasharray="3,3" />
                    <line x1="50" y1="180" x2="550" y2="180" stroke="hsl(var(--border))" strokeDasharray="3,3" />

                    {/* Plots of revenue and expenses */}
                    {/* assume 6 points: Month 1,2,3,4,5,6 */}
                    <path
                      d={`M 50,150 L 150,120 L 250,90 L 350,80 L 450,50 L 550,30`}
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="3.5"
                    />
                    <path
                      d={`M 50,160 L 150,140 L 250,120 L 350,110 L 450,90 L 550,80`}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="3.5"
                      strokeDasharray="4,4"
                    />

                    {/* Data circle markers */}
                    <circle cx="550" cy="30" r="5" fill="#22c55e" />
                    <circle cx="550" cy="80" r="5" fill="#ef4444" />

                    {/* Y Axis Labels */}
                    <text x="35" y="35" fontSize="8" className="fill-muted-foreground" textAnchor="end">إيراد مرتفع</text>
                    <text x="35" y="185" fontSize="8" className="fill-muted-foreground" textAnchor="end">baseline</text>

                    {/* X Axis labels */}
                    {predictiveData.forecasts?.map((f, idx) => (
                      <text key={idx} x={50 + idx * 100} y="195" fontSize="9" className="fill-muted-foreground" textAnchor="middle">
                        {f.month}
                      </text>
                    ))}

                    <legend>
                      <rect x="400" y="10" width="10" height="10" fill="#22c55e" />
                      <text x="415" y="18" fontSize="8" className="fill-foreground font-black">إيرادات تقديرية</text>
                      <rect x="490" y="10" width="10" height="10" fill="#ef4444" />
                      <text x="505" y="18" fontSize="8" className="fill-foreground font-black">مصروفات تقديرية</text>
                    </legend>
                  </svg>
                </CardContent>
              </Card>

              {/* Baseline stats cards */}
              <div className="space-y-4">
                <Card className="border-r-4 border-r-blue-500">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs text-muted-foreground font-bold">معدل المقبوضات الشهري الحالي</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-black text-blue-600">
                      {formatMoney(predictiveData.velocity?.baseMonthlyRevenue || 0)}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 block">متوسط آخر 3 أشهر محاسبية</span>
                  </CardContent>
                </Card>

                <Card className="border-r-4 border-r-indigo-500">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs text-muted-foreground font-bold">سرعة نمو الاشتراكات الجديدة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-black text-indigo-600">
                      +{predictiveData.velocity?.recentRegistrationsCount || 0} باقات جديدة
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 block">معدل التسجيل خلال الـ 30 يوماً الماضية</span>
                  </CardContent>
                </Card>

                <Card className="border-r-4 border-r-emerald-500">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs text-muted-foreground font-bold">متوسط سعر الساعة التعاقدية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-black text-emerald-600">
                      {formatMoney(predictiveData.velocity?.averagePricePerHour || 0)} / ساعة
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 block">الرصيد المشترك المقيم بالقيمة التنافسية</span>
                  </CardContent>
                </Card>
              </div>

              {/* Data Projections Table */}
              <Card className="lg:col-span-3">
                <CardHeader className="border-b">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    بيانات التنبؤ المالي التفصيلية لكل شهر (Projected Ledger Ledger Timeline)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-muted/40 font-black">
                        <tr>
                          <th className="p-3">الشهر المستهدف</th>
                          <th className="p-3">الإيرادات المتوقعة (Projected Revenue)</th>
                          <th className="p-3">المصروفات المتوقعة (Projected Expenses)</th>
                          <th className="p-3">صافي الأرباح المتوقعة (Projected Profit)</th>
                          <th className="p-3">النمو التراكمي المحتسب</th>
                        </tr>
                      </thead>
                      <tbody>
                        {predictiveData.forecasts?.map((f, idx) => (
                          <tr key={idx} className="border-b border-border/50 hover:bg-muted/10 font-bold">
                            <td className="p-3 text-primary">{f.month}</td>
                            <td className="p-3 text-green-600">{formatMoney(f.projectedRevenue)}</td>
                            <td className="p-3 text-red-500">{formatMoney(f.projectedExpenses)}</td>
                            <td className="p-3 text-emerald-600 font-black bg-emerald-500/5">{formatMoney(f.projectedProfit)}</td>
                            <td className="p-3 text-muted-foreground">+{Math.round((f.projectedRevenue / (predictiveData.velocity?.baseMonthlyRevenue || 1) - 1) * 100)}% زيادة</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card p-6 border rounded-xl space-y-4">
          <h3 className="text-lg font-bold">
            {reportType === 'teacher' && 'ملخص الأداء الشهري لكل معلم'}
            {reportType === 'subject' && 'ملخص الأداء الشهري لكل مادة'}
            {reportType === 'level' && 'ملخص الأداء الشهري لكل مرحلة تعليمية'}
            {reportType === 'student_financial' &&
              'كشف تقرير الطلاب المالي والتنبيهي الشامل'}
            {reportType === 'teacher_financial' &&
              'كشف تقرير المعلمين المالي وصرف المستحقات الشامل'}
          </h3>
          <DataTable columns={columns} data={data} isLoading={loading} />
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
