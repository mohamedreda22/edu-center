import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activityLog';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ['ADMIN']);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

  try {
    const body = await request.json();
    const month = parseInt(body.month);
    const year = parseInt(body.year);
    if (!month || !year) {
      return NextResponse.json({ error: 'يرجى تحديد الشهر والسنة' }, { status: 400 });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const teachers = await prisma.teacher.findMany({
      where: { isActive: true },
      select: { id: true, employeeId: true, teacherPercentage: true, institutePercentage: true, usesInstituteCar: true, user: { select: { firstName: true, lastName: true } } },
    });

    const results = [];

    for (const teacher of teachers) {
      const completedLessons = await prisma.lesson.findMany({
        where: {
          teacherId: teacher.id,
          lessonDate: { gte: startDate, lt: endDate },
          status: 'COMPLETED',
        },
        select: { lessonPrice: true, teacherEarnings: true, instituteRevenue: true },
      });

      if (completedLessons.length === 0) continue;

      const completedCount = completedLessons.length;
      const totalLessonValue = completedLessons.reduce((s, l) => s + l.lessonPrice, 0);
      const teacherEarnings = completedLessons.reduce((s, l) => s + l.teacherEarnings, 0);
      const instituteRevenue = completedLessons.reduce((s, l) => s + l.instituteRevenue, 0);
      const transportDeductions = teacher.usesInstituteCar ? completedCount * 1 : 0;
      const finalAmount = Math.max(0, teacherEarnings - transportDeductions);

      // Upsert payroll record
      const record = await prisma.payrollRecord.upsert({
        where: { teacherId_month_year: { teacherId: teacher.id, month, year } },
        update: {
          completedLessons: completedCount,
          totalLessonValue,
          teacherEarnings,
          instituteRevenue,
          transportDeductions,
          finalAmount,
        },
        create: {
          teacherId: teacher.id,
          month, year,
          completedLessons: completedCount,
          totalLessonValue,
          teacherEarnings,
          instituteRevenue,
          transportDeductions,
          finalAmount,
        },
      });

      results.push({ teacher: { id: teacher.id, employeeId: teacher.employeeId, name: `${teacher.user.firstName} ${teacher.user.lastName}` }, record });
    }

    await logActivity(auth.userId, 'GENERATE_PAYROLL', 'Payroll', `${month}-${year}`);

    return NextResponse.json({
      message: `تم إنشاء رواتب ${results.length} معلم`,
      month, year,
      records: results,
      summary: {
        totalTeachers: results.length,
        totalLessonValue: results.reduce((s, r) => s + r.record.totalLessonValue, 0),
        totalTeacherEarnings: results.reduce((s, r) => s + r.record.teacherEarnings, 0),
        totalInstituteRevenue: results.reduce((s, r) => s + r.record.instituteRevenue, 0),
        totalTransportDeductions: results.reduce((s, r) => s + r.record.transportDeductions, 0),
        totalPayroll: results.reduce((s, r) => s + r.record.finalAmount, 0),
      },
    });
  } catch (error) {
    console.error('Error generating payroll:', error);
    return NextResponse.json({ error: 'Failed to generate payroll' }, { status: 500 });
  }
}
