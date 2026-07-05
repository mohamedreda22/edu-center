export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';

const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default async function DashboardPage() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86400000);
  const todayName = dayNames[now.getDay()];

  const [
    totalStudents, activeStudents, newStudentsThisMonth,
    totalTeachers, activeTeachers, teachersAvailableToday,
    todaysLessons, pendingPayments, monthlyIncome,
    monthlyLessonData, topTeachers,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { status: 'ACTIVE' } }),
    prisma.student.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
    prisma.teacher.count(),
    prisma.teacher.count({ where: { isActive: true } }),
    prisma.teacher.count({ where: { availableDays: { contains: todayName }, isActive: true } }),
    prisma.lesson.count({ where: { lessonDate: { gte: startOfToday, lt: endOfToday } } }),
    prisma.payment.count({ where: { status: { in: ['PENDING', 'OVERDUE'] } } }),
    prisma.payment.aggregate({ where: { status: 'PAID', paidDate: { gte: firstDayOfMonth } }, _sum: { amount: true } }),
    prisma.lesson.aggregate({
      where: { lessonDate: { gte: firstDayOfMonth, lt: new Date(now.getFullYear(), now.getMonth() + 1, 1) }, status: 'COMPLETED' },
      _sum: { lessonPrice: true, teacherEarnings: true, instituteRevenue: true },
      _count: true,
    }),
    prisma.lesson.groupBy({
      by: ['teacherId'],
      where: { lessonDate: { gte: firstDayOfMonth, lt: new Date(now.getFullYear(), now.getMonth() + 1, 1) }, status: 'COMPLETED' },
      _sum: { teacherEarnings: true },
      orderBy: { _sum: { teacherEarnings: 'desc' } },
      take: 5,
    }),
  ]);

  // Enrich top teachers with names
  const teacherIds = topTeachers.map(t => t.teacherId);
  const teacherNames = teacherIds.length > 0 ? await prisma.teacher.findMany({
    where: { id: { in: teacherIds } },
    select: { id: true, employeeId: true, user: { select: { firstName: true, lastName: true } } },
  }) : [];
  const nameMap = Object.fromEntries(teacherNames.map(t => [t.id, `${t.user.firstName} ${t.user.lastName}`]));

  const recentActivity = await prisma.activityLog.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  const cards = [
    { title: 'إجمالي الطلاب', value: totalStudents, desc: `+${newStudentsThisMonth} هذا الشهر`, color: 'blue', icon: 'users' },
    { title: 'طلاب نشطون', value: activeStudents, desc: `${totalStudents ? ((activeStudents / totalStudents) * 100).toFixed(0) : 0}% من الإجمالي`, color: 'green', icon: 'check' },
    { title: 'المعلمون', value: totalTeachers, desc: `${activeTeachers} نشط`, color: 'purple', icon: 'teacher' },
    { title: 'متاحون اليوم', value: teachersAvailableToday, desc: `اليوم: ${todayName}`, color: 'teal', icon: 'clock' },
    { title: 'حصص اليوم', value: todaysLessons, desc: 'درس مجدول', color: 'orange', icon: 'book' },
    { title: 'مدفوعات معلقة', value: pendingPayments, desc: 'في انتظار الدفع', color: 'red', icon: 'cash' },
    { title: 'دخل هذا الشهر', value: `${(monthlyIncome._sum.amount || 0).toFixed(2)} د.ك`, desc: 'إجمالي المدفوعات', color: 'emerald', icon: 'wallet' },
    { title: 'تسجيلات جديدة', value: newStudentsThisMonth, desc: 'طلاب جدد هذا الشهر', color: 'indigo', icon: 'plus' },
    { title: 'إيراد الحصص', value: `${(monthlyLessonData._sum.instituteRevenue || 0).toFixed(2)} د.ك`, desc: `${monthlyLessonData._count} حصة منجزة`, color: 'amber', icon: 'chart' },
    { title: 'أرباح المعلمين', value: `${(monthlyLessonData._sum.teacherEarnings || 0).toFixed(2)} د.ك`, desc: 'رواتب هذا الشهر', color: 'rose', icon: 'wallet' },
    { title: 'متوسط سعر الحصة', value: `${monthlyLessonData._count > 0 ? ((monthlyLessonData._sum.lessonPrice || 0) / monthlyLessonData._count).toFixed(2) : 0} د.ك`, desc: 'القيمة المتوسطة', color: 'cyan', icon: 'cash' },
  ];

  const colorMap: Record<string, { bg: string; text: string; light: string }> = {
    blue: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50' },
    green: { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50' },
    purple: { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50' },
    teal: { bg: 'bg-teal-500', text: 'text-teal-600', light: 'bg-teal-50' },
    orange: { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50' },
    red: { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50' },
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50' },
    indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600', light: 'bg-indigo-50' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50' },
    rose: { bg: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-50' },
    cyan: { bg: 'bg-cyan-500', text: 'text-cyan-600', light: 'bg-cyan-50' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-sm text-gray-500 mt-1">
            {now.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => {
          const c = colorMap[card.color];
          return (
            <div key={card.title} className={`${c.light} rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">{card.title}</p>
                  <p className={`text-3xl font-bold ${c.text}`}>{card.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{card.desc}</p>
                </div>
                <div className={`${c.bg} bg-opacity-20 p-3 rounded-lg`}>
                  <div className={`w-6 h-6 ${c.text}`}>
                    {card.icon === 'users' && <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>}
                    {card.icon === 'check' && <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    {card.icon === 'teacher' && <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>}
                    {card.icon === 'clock' && <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    {card.icon === 'book' && <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                    {card.icon === 'cash' && <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                    {card.icon === 'wallet' && <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
                    {card.icon === 'plus' && <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
                    {card.icon === 'chart' && <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            آخر النشاطات
          </h2>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
              <p className="text-gray-400 text-sm">لا توجد نشاطات بعد</p>
            </div>
          ) : (
            <div className="space-y-0">
              {recentActivity.map((activity, i) => (
                <div key={activity.id} className={`flex items-center gap-3 py-3 ${i < recentActivity.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{activity.user.firstName} {activity.user.lastName}</span>
                      {' '}{activity.action === 'CREATE_STUDENT' ? 'أضاف طالباً' :
                        activity.action === 'CREATE_TEACHER' ? 'أضاف معلماً' :
                        activity.action === 'UPDATE_STUDENT' ? 'حدّث طالباً' :
                        activity.action === 'UPDATE_TEACHER' ? 'حدّث معلماً' :
                        activity.action === 'DELETE_TEACHER' ? 'حذف معلماً' :
                        activity.action === 'ARCHIVE_STUDENT' ? 'أرشف طالباً' :
                        activity.action}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{new Date(activity.createdAt).toLocaleString('ar-SA')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            نظرة سريعة
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">نسبة الطلاب النشطين</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${totalStudents ? (activeStudents / totalStudents) * 100 : 0}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-700">{totalStudents ? ((activeStudents / totalStudents) * 100).toFixed(0) : 0}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">المعلمون النشطون</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${totalTeachers ? (activeTeachers / totalTeachers) * 100 : 0}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-700">{activeTeachers}/{totalTeachers}</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">متوسط الدخل الشهري</span>
              <span className="text-sm font-medium text-gray-700">{monthlyIncome._sum.amount ? `${(monthlyIncome._sum.amount / Math.max(1, (now.getMonth() + 1))).toFixed(2)} د.ك` : '0 د.ك'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">إجمالي الطلاب</span>
              <span className="text-lg font-bold text-blue-600">{totalStudents}</span>
            </div>
            <div className="pt-3 border-t border-gray-100 mt-2">
              <span className="text-sm font-medium text-gray-700">أفضل المعلمين هذا الشهر</span>
              {topTeachers.length === 0 ? (
                <p className="text-xs text-gray-400 mt-1">لا توجد بيانات</p>
              ) : (
                <div className="mt-2 space-y-1">
                  {topTeachers.map((t, i) => (
                    <div key={t.teacherId} className="flex justify-between text-xs">
                      <span>{i + 1}. {nameMap[t.teacherId] || t.teacherId.slice(0, 8)}</span>
                      <span className="font-medium text-green-600">{(t._sum.teacherEarnings || 0).toFixed(2)} د.ك</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
