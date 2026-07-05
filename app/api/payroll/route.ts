import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

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
    const records = await prisma.payrollRecord.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true, employeeId: true, usesInstituteCar: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return NextResponse.json({ records });
  } catch (error) {
    console.error('Error fetching payroll:', error);
    return NextResponse.json({ error: 'Failed to fetch payroll' }, { status: 500 });
  }
}
