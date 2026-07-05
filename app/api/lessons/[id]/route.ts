import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activityLog';
import { z } from 'zod';
import { recalculatePayrollForTeacher } from '@/lib/payroll';

const updateSchema = z.object({
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  notes: z.string().optional().or(z.literal('')),
  lessonPrice: z.coerce.number().min(0).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ['ADMIN', 'RECEPTIONIST']);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(', ') }, { status: 400 });
    }

    const existing = await prisma.lesson.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (parsed.data.status) updateData.status = parsed.data.status;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes || null;
    if (parsed.data.lessonPrice !== undefined) updateData.lessonPrice = parsed.data.lessonPrice;

    // If price changed, recalculate earnings using stored percentages
    if (parsed.data.lessonPrice !== undefined && parsed.data.lessonPrice !== existing.lessonPrice) {
      const price = parsed.data.lessonPrice;
      updateData.teacherEarnings = price * existing.teacherPercentage;
      updateData.instituteRevenue = price * existing.institutePercentage;
    }

    // If status changed to COMPLETED, ensure earnings are calculated
    if (parsed.data.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      const price = parsed.data.lessonPrice ?? existing.lessonPrice;
      updateData.teacherEarnings = price * existing.teacherPercentage;
      updateData.instituteRevenue = price * existing.institutePercentage;
    }

    // If cancelled/no_show, zero out earnings
    if (parsed.data.status === 'CANCELLED' || parsed.data.status === 'NO_SHOW') {
      updateData.teacherEarnings = 0;
      updateData.instituteRevenue = 0;
    }

    const lesson = await prisma.lesson.update({
      where: { id },
      data: updateData,
      include: {
        teacher: { select: { id: true, employeeId: true, user: { select: { firstName: true, lastName: true } } } },
        student: { select: { id: true, studentId: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    // Audit trail for any financial change
    const priceChanged = parsed.data.lessonPrice !== undefined && parsed.data.lessonPrice !== existing.lessonPrice;
    const statusChanged = parsed.data.status && parsed.data.status !== existing.status;
    if (priceChanged || statusChanged) {
      await prisma.payrollTransaction.create({
        data: {
          lessonId: id,
          teacherId: existing.teacherId,
          userId: auth.userId,
          lessonPrice: lesson.lessonPrice,
          teacherPercentage: lesson.teacherPercentage,
          institutePercentage: lesson.institutePercentage,
          teacherEarnings: lesson.teacherEarnings,
          instituteRevenue: lesson.instituteRevenue,
          action: statusChanged ? `STATUS_${existing.status}_TO_${parsed.data.status}` : 'PRICE_CHANGE',
          previousValue: { oldStatus: existing.status, oldPrice: existing.lessonPrice, oldEarnings: existing.teacherEarnings },
          newValue: { newStatus: lesson.status, newPrice: lesson.lessonPrice, newEarnings: lesson.teacherEarnings },
        },
      });
    }

    // Auto-recalculate payroll for this teacher/month
    const lessonMonth = lesson.lessonDate.getMonth() + 1;
    const lessonYear = lesson.lessonDate.getFullYear();
    await recalculatePayrollForTeacher(existing.teacherId, lessonMonth, lessonYear, auth.userId);

    await logActivity(auth.userId, 'UPDATE_LESSON', 'Lesson', id);
    return NextResponse.json({ lesson });
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ['ADMIN']);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

  try {
    const { id } = await params;
    const existing = await prisma.lesson.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });

    await prisma.lesson.delete({ where: { id } });

    // Auto-recalculate payroll after deletion
    const lessonMonth = existing.lessonDate.getMonth() + 1;
    const lessonYear = existing.lessonDate.getFullYear();
    await recalculatePayrollForTeacher(existing.teacherId, lessonMonth, lessonYear, auth.userId);

    await logActivity(auth.userId, 'DELETE_LESSON', 'Lesson', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 });
  }
}
