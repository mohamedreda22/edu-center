import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activityLog';
import { salarySchema } from '@/lib/validations/salary';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacherId') || '';
  const month = parseInt(searchParams.get('month') || '');
  const year = parseInt(searchParams.get('year') || '');

  const where: Record<string, unknown> = {};
  if (teacherId) where.teacherId = teacherId;
  if (month) where.month = month;
  if (year) where.year = year;

  try {
    const salaries = await prisma.teacherSalary.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            employeeId: true,
            hourlyRate: true,
            user: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return NextResponse.json({ salaries });
  } catch (error) {
    console.error('Error fetching salaries:', error);
    return NextResponse.json({ error: 'Failed to fetch salaries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ['ADMIN']);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = salarySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(', ') }, { status: 400 });
    }

    const data = parsed.data;
    const totalSalary =
      data.hoursWorked * data.hourlyRate +
      data.transportationAllowance +
      data.bonuses -
      data.deductions;

    const salary = await prisma.teacherSalary.create({
      data: {
        teacherId: data.teacherId,
        month: data.month,
        year: data.year,
        lessonsCount: data.lessonsCount,
        hoursWorked: data.hoursWorked,
        hourlyRate: data.hourlyRate,
        transportationAllowance: data.transportationAllowance,
        bonuses: data.bonuses,
        deductions: data.deductions,
        totalSalary: Math.max(0, totalSalary),
        notes: data.notes || null,
      },
      include: {
        teacher: {
          select: {
            id: true,
            employeeId: true,
            hourlyRate: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    await logActivity(auth.userId, 'CREATE_SALARY', 'TeacherSalary', salary.id);
    return NextResponse.json({ salary }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'تم تسجيل راتب هذا المعلم لهذا الشهر مسبقاً' }, { status: 409 });
    }
    console.error('Error creating salary:', error);
    return NextResponse.json({ error: 'Failed to create salary' }, { status: 500 });
  }
}
