import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activityLog';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request, ['ADMIN', 'RECEPTIONIST']);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

  try {
    const body = await request.json();
    const { id } = await params;
    const payment = await prisma.payment.update({
      where: { id },
      data: {
        amount: body.amount !== undefined ? body.amount : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        paidDate: body.paidDate ? new Date(body.paidDate) : body.paidDate === null ? null : undefined,
        status: body.status || undefined,
        paymentMethod: body.paymentMethod !== undefined ? body.paymentMethod : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            monthlyFee: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    await logActivity(auth.userId, 'UPDATE_PAYMENT', 'Payment', payment.id);
    return NextResponse.json({ payment });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request, ['ADMIN']);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.payment.delete({ where: { id } });
    await logActivity(auth.userId, 'DELETE_PAYMENT', 'Payment', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
}
