import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'overview';
  const month = parseInt(searchParams.get('month') || '');
  const year = parseInt(searchParams.get('year') || '');
  const teacherId = searchParams.get('teacherId') || '';

  const startDate = month && year ? new Date(year, month - 1, 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = month && year ? new Date(year, month, 1) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

  try {
    switch (type) {
      case 'by_teacher': {
        const where: Record<string, unknown> = {
          lessonDate: { gte: startDate, lt: endDate },
          status: 'COMPLETED',
        };
        if (teacherId) where.teacherId = teacherId;

        const lessons = await prisma.lesson.findMany({
          where,
          include: {
            teacher: { select: { id: true, employeeId: true, usesInstituteCar: true, user: { select: { firstName: true, lastName: true } } } },
          },
        });

        const grouped: Record<string, any> = {};
        for (const l of lessons) {
          const tid = l.teacherId;
          if (!grouped[tid]) {
            grouped[tid] = {
              teacher: { id: tid, employeeId: l.teacher.employeeId, name: `${l.teacher.user.firstName} ${l.teacher.user.lastName}` },
              totalLessons: 0, grossValue: 0, teacherShare: 0, instituteShare: 0, transportDeductions: 0,
            };
          }
          grouped[tid].totalLessons++;
          grouped[tid].grossValue += l.lessonPrice;
          grouped[tid].teacherShare += l.teacherEarnings;
          grouped[tid].instituteShare += l.instituteRevenue;
          if (l.teacher.usesInstituteCar) grouped[tid].transportDeductions += 1;
        }

        return NextResponse.json({
          type: 'by_teacher', month, year,
          reports: Object.values(grouped).map((g: any) => ({
            ...g, netPayment: g.teacherShare - g.transportDeductions,
          })),
        });
      }

      case 'by_subject': {
        const lessons = await prisma.lesson.findMany({
          where: { lessonDate: { gte: startDate, lt: endDate }, status: 'COMPLETED' },
          select: { title: true, lessonPrice: true, teacherEarnings: true, instituteRevenue: true },
        });

        const grouped: Record<string, any> = {};
        for (const l of lessons) {
          const subj = l.title || 'غير محدد';
          if (!grouped[subj]) grouped[subj] = { subject: subj, totalLessons: 0, grossValue: 0, teacherShare: 0, instituteShare: 0 };
          grouped[subj].totalLessons++;
          grouped[subj].grossValue += l.lessonPrice;
          grouped[subj].teacherShare += l.teacherEarnings;
          grouped[subj].instituteShare += l.instituteRevenue;
        }

        return NextResponse.json({ type: 'by_subject', month, year, reports: Object.values(grouped) });
      }

      case 'by_level': {
        const lessons = await prisma.lesson.findMany({
          where: { lessonDate: { gte: startDate, lt: endDate }, status: 'COMPLETED' },
          select: { educationalLevel: true, lessonPrice: true, teacherEarnings: true, instituteRevenue: true },
        });

        const grouped: Record<string, any> = {};
        for (const l of lessons) {
          const level = l.educationalLevel || 'غير محدد';
          if (!grouped[level]) grouped[level] = { level, totalLessons: 0, grossValue: 0, teacherShare: 0, instituteShare: 0 };
          grouped[level].totalLessons++;
          grouped[level].grossValue += l.lessonPrice;
          grouped[level].teacherShare += l.teacherEarnings;
          grouped[level].instituteShare += l.instituteRevenue;
        }

        return NextResponse.json({ type: 'by_level', month, year, reports: Object.values(grouped) });
      }

      default: {
        // Overview / dashboard financial summary
        const lessons = await prisma.lesson.findMany({
          where: { lessonDate: { gte: startDate, lt: endDate }, status: 'COMPLETED' },
          select: {
            lessonPrice: true, teacherEarnings: true, instituteRevenue: true,
            title: true, teacherId: true,
            teacher: { select: { id: true, employeeId: true, user: { select: { firstName: true, lastName: true } } } },
          },
        });

        const totalLessons = lessons.length;
        const grossValue = lessons.reduce((s, l) => s + l.lessonPrice, 0);
        const teacherPayroll = lessons.reduce((s, l) => s + l.teacherEarnings, 0);
        const instituteRevenue = lessons.reduce((s, l) => s + l.instituteRevenue, 0);
        const avgPrice = totalLessons > 0 ? grossValue / totalLessons : 0;

        // Top teachers
        const teacherMap: Record<string, any> = {};
        for (const l of lessons) {
          if (!teacherMap[l.teacherId]) {
            teacherMap[l.teacherId] = {
              id: l.teacherId,
              name: `${l.teacher.user.firstName} ${l.teacher.user.lastName}`,
              lessons: 0, revenue: 0,
            };
          }
          teacherMap[l.teacherId].lessons++;
          teacherMap[l.teacherId].revenue += l.teacherEarnings;
        }
        const topTeachers = Object.values(teacherMap).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5);

        // Top subjects
        const subjectMap: Record<string, any> = {};
        for (const l of lessons) {
          const subj = l.title || 'غير محدد';
          if (!subjectMap[subj]) subjectMap[subj] = { subject: subj, lessons: 0, revenue: 0 };
          subjectMap[subj].lessons++;
          subjectMap[subj].revenue += l.instituteRevenue;
        }
        const topSubjects = Object.values(subjectMap).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5);

        return NextResponse.json({
          type: 'overview',
          month, year,
          totalLessons, grossValue, teacherPayroll, instituteRevenue, avgPrice,
          netIncome: grossValue - teacherPayroll,
          topTeachers, topSubjects,
        });
      }
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
