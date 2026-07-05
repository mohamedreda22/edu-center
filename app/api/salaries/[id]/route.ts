import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activityLog';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request, ['ADMIN']);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const salary = await prisma.teacherSalary.update({
      where: { id },
      data: {
        lessonsCount: body.lessonsCount !== undefined ? body.lessonsCount : undefined,
        hoursWorked: body.hoursWorked !== undefined ? body.hoursWorked : undefined,
        transportationAllowance: body.transportationAllowance !== undefined ? body.transportationAllowance : undefined,
        bonuses: body.bonuses !== undefined ? body.bonuses : undefined,
        deductions: body.deductions !== undefined ? body.deductions : undefined,
        totalSalary: body.totalSalary !== undefined ? body.totalSalary : undefined,
        paid: body.paid !== undefined ? body.paid : undefined,
        paidDate: body.paid ? new Date() : body.paid === false ? null : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
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

    await logActivity(auth.userId, 'UPDATE_SALARY', 'TeacherSalary', salary.id);
    return NextResponse.json({ salary });
  } catch (error: any) {
    const msg = error?.message || error?.code || 'Unknown error';
    console.error('Error updating salary:', error);
    return NextResponse.json({ error: `Failed to update salary: ${msg}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request, ['ADMIN']);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.teacherSalary.delete({ where: { id } });
    await logActivity(auth.userId, 'DELETE_SALARY', 'TeacherSalary', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting salary:', error);
    return NextResponse.json({ error: 'Failed to delete salary' }, { status: 500 });
  }
}
