import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  CreditCard,
  Award,
  BookOpen,
  Clock,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Bookmark,
  Flame,
  Gift
} from 'lucide-react';
import React from 'react';

import { studentApi } from '@/features/students/services/studentApi';
import { useAuth } from '@/features/auth/AuthContext';
import StatCard from '@/shared/components/StatCard/StatCard';
import StatusBadge from '@/shared/components/StatusBadge/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatDate } from '@/shared/utils/date';
import { formatMoney } from '@/shared/utils/money';

const StudentDashboard = () => {
  const { accessToken, isAuthenticated } = useAuth();

  const { data: portalData, isLoading, isError } = useQuery({
    queryKey: ['student-portal-dashboard'],
    queryFn: () => studentApi.getStudentDashboard(),
    enabled: isAuthenticated && !!accessToken,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500 font-bold bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 justify-center">
        <AlertCircle className="h-5 w-5" />
        حدث خطأ أثناء تحميل بيانات لوحة الطالب
      </div>
    );
  }

  const {
    profile,
    upcomingLessons,
    recentAttendance,
    payments,
    outstandingBalance,
    remainingHours,
    totalPurchasedHours,
    totalConsumedHours,
    groups,
  } = portalData?.data || {};

  // Calculate circular progress parameters
  const safeTotalHours = totalPurchasedHours || 10;
  const safeRemainingHours = remainingHours || 0;
  const progressPercent = Math.min(100, Math.max(0, (safeRemainingHours / safeTotalHours) * 100));
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="space-y-8 text-right" dir="rtl">

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
        <StatCard
          label="المبلغ المستحق السداد"
          value={formatMoney(outstandingBalance ?? 0)}
          icon={CreditCard}
          className="xl:col-span-2 border-red-100"
        />
        <StatCard
          label="الساعات المتبقية للدراسة"
          value={`${remainingHours} ساعة`}
          icon={Clock}
          isFeatured={true}
          className="xl:col-span-2 border-secondary/20"
        />
        <StatCard
          label="الساعات المستهلكة"
          value={`${totalConsumedHours} ساعة`}
          icon={Award}
          className="xl:col-span-1 border-emerald-100"
        />
        <StatCard
          label="إجمالي ساعات الباقة"
          value={`${totalPurchasedHours} ساعة`}
          icon={BookOpen}
          className="xl:col-span-1"
        />
      </div>

      {/* Profile, Circular Progress Ring & Achievement Badges Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Circular Progress Ring Card */}
        <Card className="shadow-premium-md border border-border flex flex-col justify-between">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-sm font-black text-primary flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-accent animate-pulse" />
              مؤشر الرصيد الاستهلاكي للساعات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center">
              <svg className="w-36 h-36 transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  className="stroke-muted"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Foreground Progress Ring with Dynamic Glowing Gradient */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  className="stroke-accent transition-all duration-700 ease-out"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              {/* Inner Center Text */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-foreground">{remainingHours}</span>
                <span className="text-[10px] text-muted-foreground font-bold">ساعة متبقية</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground font-bold">لقد قمت باستهلاك {progressPercent.toFixed(0)}% من الرصيد المتوفر بنجاح.</p>
            </div>
          </CardContent>
        </Card>

        {/* Gamified Achievement Badges Card */}
        <Card className="shadow-premium-md border border-border">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-sm font-black text-primary flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-accent animate-bounce" />
              الأوسمة والشارات الأكاديمية (My Badges)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-2 gap-3 text-center">
            {/* Badge 1 */}
            <div className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-1.5 shadow-premium-sm transition-all ${
              totalConsumedHours >= 5 ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' : 'bg-muted/10 border-border opacity-40 text-muted-foreground'
            }`}>
              <Flame className="h-6 w-6" />
              <span className="text-[10px] font-black block">نجم الالتزام</span>
              <span className="text-[8px] font-medium block">حضور 5 حصص</span>
            </div>

            {/* Badge 2 */}
            <div className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-1.5 shadow-premium-sm transition-all ${
              totalConsumedHours >= 10 ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' : 'bg-muted/10 border-border opacity-40 text-muted-foreground'
            }`}>
              <Award className="h-6 w-6" />
              <span className="text-[10px] font-black block">بطل الساعات</span>
              <span className="text-[8px] font-medium block">10+ ساعات منفذة</span>
            </div>

            {/* Badge 3 */}
            <div className="p-3 border border-emerald-500/20 bg-emerald-500/10 rounded-xl flex flex-col items-center justify-center gap-1.5 shadow-premium-sm text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
              <span className="text-[10px] font-black block">التنشيط الأكاديمي</span>
              <span className="text-[8px] font-medium block">حساب مفعل ومستقر</span>
            </div>

            {/* Badge 4 */}
            <div className="p-3 border border-pink-500/20 bg-pink-500/10 rounded-xl flex flex-col items-center justify-center gap-1.5 shadow-premium-sm text-pink-600">
              <Gift className="h-6 w-6" />
              <span className="text-[10px] font-black block">الخصم السكني</span>
              <span className="text-[8px] font-medium block">خصومات معهد ألفا</span>
            </div>
          </CardContent>
        </Card>

        {/* Student Profile Card */}
        <Card className="shadow-premium-md border border-border">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-sm font-black text-primary">معلومات الملف التعريفي</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs font-bold text-slate-600">
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-400">كود العضوية والطلب:</span>
              <span className="font-mono text-primary font-black">{profile?.studentCode}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-400">المرحلة والصف:</span>
              <span className="text-primary font-black">{profile?.grade}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-400">ولي الأمر:</span>
              <span className="text-primary font-black">{profile?.parentName}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-400">هاتف الطوارئ والمتابعة:</span>
              <span className="text-primary font-black font-mono">{profile?.parentPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">العنوان والمنطقة:</span>
              <span className="text-primary font-black">{profile?.area || 'غير مسجل'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Milestones Timeline Journey Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Timeline Journey Card */}
        <Card className="lg:col-span-2 shadow-premium-md border border-border">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-sm font-black text-primary flex items-center gap-2">
              <Bookmark className="h-4.5 w-4.5 text-accent animate-pulse" />
              الخط الزمني وخريطة الطريق لرحلتي الأكاديمية (My Journey Roadmap)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 relative select-none">
            {/* Elegant vertical visual divider line */}
            <div className="absolute right-9 top-8 bottom-8 w-1 bg-border/60 rounded-full" />

            <div className="space-y-6 relative z-10 mr-4">
              {/* Milestone 1 */}
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-premium-md shrink-0">
                  🚀
                </div>
                <div className="flex-1 bg-surface p-3 rounded-xl border border-border">
                  <h4 className="text-xs font-black text-foreground">تفعيل الحساب والبداية</h4>
                  <p className="text-[10px] text-muted-foreground mt-1">تم إعداد الملف الطلابي وتنشيط باقة الساعات بنجاح بمعهد ألفا العالمي.</p>
                </div>
              </div>

              {/* Milestone 2 */}
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-premium-md shrink-0">
                  📚
                </div>
                <div className="flex-1 bg-surface p-3 rounded-xl border border-border">
                  <h4 className="text-xs font-black text-foreground">القيد الأكاديمي والمجموعات الدراسية</h4>
                  <p className="text-[10px] text-muted-foreground mt-1">تم الانتهاء من فحص وتحديد الجدول الدراسي وتوزيع الحصص على القاعات بنجاح.</p>
                </div>
              </div>

              {/* Milestone 3 */}
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm shadow-premium-md shrink-0 animate-bounce">
                  ✨
                </div>
                <div className="flex-1 bg-surface p-3 rounded-xl border border-border">
                  <h4 className="text-xs font-black text-foreground">حضور الحصص والامتياز الأكاديمي</h4>
                  <p className="text-[10px] text-muted-foreground mt-1">لقد قمت بحضور {totalConsumedHours} حصة دراسية تفاعلية حتى الآن مع المعلمين الأفاضل.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Registered Classes/Groups */}
        <Card className="shadow-premium-md border border-border">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-sm font-black text-primary">المجموعات المقيد بها</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {groups?.length > 0 ? (
              groups.map((g) => (
                <div key={g._id} className="flex items-center justify-between p-3 border border-border rounded-xl bg-card shadow-premium-sm hover:bg-surface transition-colors">
                  <div>
                    <h4 className="text-xs font-black text-foreground">{g.name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1">الدورة: {g.courseId?.name || 'مخصص'}</p>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] bg-secondary/15 text-secondary px-3 py-1 rounded-full font-black">
                      {g.courseId?.subject || 'مادة تخصصية'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic py-8 text-center">لست مقيداً بأي مجموعات دراسية حالياً</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lessons Schedule & Payments History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Schedule */}
        <Card className="shadow-premium-md border border-border">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
            <CardTitle className="text-sm font-black text-primary flex items-center gap-2">
              <Calendar className="h-5 w-5 text-secondary" />
              جدول حصصي القادمة (Next Lessons)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 max-h-[350px] overflow-y-auto">
            {upcomingLessons?.length > 0 ? (
              upcomingLessons.map((lesson) => (
                <div key={lesson._id} className="flex items-center justify-between p-3 border border-border rounded-xl bg-card shadow-premium-sm">
                  <div>
                    <p className="text-xs font-black text-foreground">{lesson.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">المعلم: أ/ {lesson.teacherId?.firstName} {lesson.teacherId?.lastName}</p>
                  </div>
                  <div className="text-left space-y-1">
                    <p className="text-xs font-black text-foreground">{formatDate(lesson.lessonDate, 'yyyy/MM/dd')}</p>
                    <p className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3" />
                      {lesson.startTime}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic py-8 text-center">لا توجد حصص مجدولة حالياً</p>
            )}
          </CardContent>
        </Card>

        {/* Payments/Invoices history */}
        <Card className="shadow-premium-md border border-border">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
            <CardTitle className="text-sm font-black text-primary flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-secondary" />
              كشف الفواتير والمدفوعات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 max-h-[350px] overflow-y-auto">
            {payments?.length > 0 ? (
              payments.map((payment) => (
                <div key={payment._id} className="flex items-center justify-between p-3 border border-border rounded-xl bg-card shadow-premium-sm">
                  <div>
                    <p className="text-xs font-black text-foreground">قيمة الدفعة: {formatMoney(payment.amount)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">تاريخ الاستحقاق: {formatDate(payment.dueDate, 'yyyy/MM/dd')}</p>
                  </div>
                  <div className="text-left">
                    <StatusBadge status={payment.status} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic py-8 text-center">لا توجد سجلات فواتير أو مدفوعات حالياً</p>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default StudentDashboard;
