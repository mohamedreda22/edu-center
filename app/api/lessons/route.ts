import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activityLog';
import { lessonSchema } from '@/lib/validations/lesson';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacherId') || '';
  const studentId = searchParams.get('studentId') || '';
  const dateStr = searchParams.get('date') || '';

  const where: Record<string, unknown> = {};
  if (teacherId) where.teacherId = teacherId;
  if (studentId) where.studentId = studentId;
  if (dateStr) {
    const d = new Date(dateStr);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.lessonDate = { gte: d, lt: next };
  }

  try {
    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        teacher: { select: { id: true, employeeId: true, user: { select: { firstName: true, lastName: true } } } },
        student: { select: { id: true, studentId: true, user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { lessonDate: 'asc' },
    });
    return NextResponse.json({ lessons });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ['ADMIN', 'RECEPTIONIST']);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = lessonSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(', ') }, { status: 400 });
    }

    const data = parsed.data;
    const lessonDate = new Date(data.date);
    const [h, m] = data.startTime.split(':').map(Number);
    lessonDate.setHours(h, m, 0, 0);

    const endMinutes = h * 60 + m + data.durationHours * 60;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    // Check teacher conflict
    const teacherConflict = await prisma.lesson.findFirst({
      where: {
        teacherId: data.teacherId,
        lessonDate: {
          gte: new Date(lessonDate.getTime() - 24 * 60 * 60 * 1000),
          lt: new Date(lessonDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });
    if (teacherConflict) {
      return NextResponse.json({ error: 'المعلم لديه حصة في هذا الوقت مسبقاً' }, { status: 409 });
    }

    // Check student conflict
    const studentConflict = await prisma.lesson.findFirst({
      where: {
        studentId: data.studentId,
        lessonDate: {
          gte: new Date(lessonDate.getTime() - 24 * 60 * 60 * 1000),
          lt: new Date(lessonDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });
    if (studentConflict) {
      return NextResponse.json({ error: 'الطالب لديه حصة في هذا الوقت مسبقاً' }, { status: 409 });
    }

    // Fetch teacher commission percentages
    const teacher = await prisma.teacher.findUnique({
      where: { id: data.teacherId },
      select: { teacherPercentage: true, institutePercentage: true },
    });
    const tPct = teacher?.teacherPercentage ?? 0.7;
    const iPct = teacher?.institutePercentage ?? 0.3;
    const price = data.lessonPrice || 0;

    const lesson = await prisma.lesson.create({
      data: {
        studentId: data.studentId,
        teacherId: data.teacherId,
        title: data.subject,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime,
        durationHours: data.durationHours,
        lessonDate,
        status: data.status || 'SCHEDULED',
        notes: data.notes || null,
        lessonPrice: price,
        educationalLevel: data.educationalLevel || null,
        teacherPercentage: tPct,
        institutePercentage: iPct,
        teacherEarnings: price * tPct,
        instituteRevenue: price * iPct,
      },
      include: {
        teacher: { select: { id: true, employeeId: true, user: { select: { firstName: true, lastName: true } } } },
        student: { select: { id: true, studentId: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    // Audit trail
    await prisma.payrollTransaction.create({
      data: {
        lessonId: lesson.id,
        teacherId: data.teacherId,
        lessonPrice: price,
        teacherPercentage: tPct,
        institutePercentage: iPct,
        teacherEarnings: price * tPct,
        instituteRevenue: price * iPct,
        action: 'CREATE',
      },
    });

    await logActivity(auth.userId, 'CREATE_LESSON', 'Lesson', lesson.id);
    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 });
  }
}
