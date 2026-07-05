import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ['ADMIN']);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

  try {
    const body = await request.json();
    const { teacherId, month, year } = body;
    if (!teacherId || !month || !year) {
      return NextResponse.json({ error: 'يرجى تحديد المعلم والشهر والسنة' }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true, hourlyRate: true, employeeId: true },
    });
    if (!teacher) return NextResponse.json({ error: 'المعلم غير موجود' }, { status: 404 });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const lessons = await prisma.lesson.findMany({
      where: {
        teacherId,
        lessonDate: { gte: startDate, lt: endDate },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      select: { durationHours: true, status: true, startTime: true, endTime: true },
    });

    const lessonsCount = lessons.length;
    const hoursWorked = lessons.reduce((sum, l) => sum + (l.durationHours || 0), 0);
    const hourlyRate = teacher.hourlyRate || 0;

    return NextResponse.json({
      teacher: { id: teacher.id, employeeId: teacher.employeeId },
      lessonsCount,
      hoursWorked,
      hourlyRate,
      baseSalary: hoursWorked * hourlyRate,
      month,
      year,
      lessonDetails: lessons.map(l => ({ durationHours: l.durationHours, status: l.status })),
    });
  } catch (error) {
    console.error('Error calculating salary:', error);
    return NextResponse.json({ error: 'Failed to calculate salary' }, { status: 500 });
  }
}
