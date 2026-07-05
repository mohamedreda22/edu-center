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
    const record = await prisma.payrollRecord.update({
      where: { id },
      data: {
        paid: body.paid !== undefined ? body.paid : undefined,
        paidDate: body.paid ? new Date() : body.paid === false ? null : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
      },
    });
    await logActivity(auth.userId, 'UPDATE_PAYROLL', 'PayrollRecord', id);
    return NextResponse.json({ record });
  } catch (error) {
    console.error('Error updating payroll:', error);
    return NextResponse.json({ error: 'Failed to update payroll' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request, ['ADMIN']);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.payrollRecord.delete({ where: { id } });
    await logActivity(auth.userId, 'DELETE_PAYROLL', 'PayrollRecord', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payroll:', error);
    return NextResponse.json({ error: 'Failed to delete payroll' }, { status: 500 });
  }
}
