import { prisma } from '@/lib/db';

export async function recalculatePayrollForTeacher(teacherId: string, month: number, year: number, userId?: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { id: true, usesInstituteCar: true },
  });
  if (!teacher) return;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const completedLessons = await prisma.lesson.findMany({
    where: {
      teacherId,
      lessonDate: { gte: startDate, lt: endDate },
      status: 'COMPLETED',
    },
    select: { lessonPrice: true, teacherEarnings: true, instituteRevenue: true, id: true },
  });

  const completedCount = completedLessons.length;
  const totalLessonValue = completedLessons.reduce((s, l) => s + l.lessonPrice, 0);
  const teacherEarnings = completedLessons.reduce((s, l) => s + l.teacherEarnings, 0);
  const instituteRevenue = completedLessons.reduce((s, l) => s + l.instituteRevenue, 0);
  const transportDeductions = teacher.usesInstituteCar ? completedCount * 1 : 0;
  const finalAmount = Math.max(0, teacherEarnings - transportDeductions);

  const existing = await prisma.payrollRecord.findUnique({
    where: { teacherId_month_year: { teacherId, month, year } },
  });

  const oldValue = existing ? {
    completedLessons: existing.completedLessons,
    totalLessonValue: existing.totalLessonValue,
    teacherEarnings: existing.teacherEarnings,
    instituteRevenue: existing.instituteRevenue,
    transportDeductions: existing.transportDeductions,
    finalAmount: existing.finalAmount,
  } : null;

  const record = await prisma.payrollRecord.upsert({
    where: { teacherId_month_year: { teacherId, month, year } },
    update: {
      completedLessons: completedCount,
      totalLessonValue,
      teacherEarnings,
      instituteRevenue,
      transportDeductions,
      finalAmount,
    },
    create: {
      teacherId,
      month, year,
      completedLessons: completedCount,
      totalLessonValue,
      teacherEarnings,
      instituteRevenue,
      transportDeductions,
      finalAmount,
    },
  });

  // Audit: log recalculation with old/new values
  if (oldValue && userId) {
    await prisma.payrollTransaction.create({
      data: {
        lessonId: completedLessons[0]?.id || 'batch',
        payrollRecordId: record.id,
        teacherId,
        userId,
        lessonPrice: totalLessonValue,
        teacherPercentage: completedCount > 0 ? teacherEarnings / totalLessonValue : 0,
        institutePercentage: completedCount > 0 ? instituteRevenue / totalLessonValue : 0,
        teacherEarnings,
        instituteRevenue,
        transportDeduction: transportDeductions,
        action: 'RECALCULATE',
        previousValue: oldValue,
        newValue: {
          completedLessons: completedCount,
          totalLessonValue,
          teacherEarnings,
          instituteRevenue,
          transportDeductions,
          finalAmount,
        },
      },
    });
  }

  return record;
}
