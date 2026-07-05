import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activityLog';
import { paymentSchema } from '@/lib/validations/payment';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId') || '';
  const month = parseInt(searchParams.get('month') || '');
  const year = parseInt(searchParams.get('year') || '');

  const where: Record<string, unknown> = {};
  if (studentId) where.studentId = studentId;

  try {
    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            monthlyFee: true,
            user: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ['ADMIN', 'RECEPTIONIST']);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = paymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(', ') }, { status: 400 });
    }

    const data = parsed.data;
    const payment = await prisma.payment.create({
      data: {
        studentId: data.studentId,
        amount: data.amount,
        dueDate: new Date(data.dueDate),
        paidDate: data.paidDate ? new Date(data.paidDate) : null,
        status: data.status as any,
        paymentMethod: data.paymentMethod || null,
        notes: data.notes || null,
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

    await logActivity(auth.userId, 'CREATE_PAYMENT', 'Payment', payment.id);
    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
