import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activityLog';
import { teacherSchema } from '@/lib/validations/teacher';
import { recalculatePayrollForTeacher } from '@/lib/payroll';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ['ADMIN', 'RECEPTIONIST']);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { id } = await params;

    const existing = await prisma.teacher.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = teacherSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const teacher = await prisma.teacher.update({
      where: { id },
      data: {
        whatsapp: data.whatsapp || null,
        civilId: data.civilId || null,
        subjects: data.subjects,
        gradesTaught: data.gradesTaught,
        gender: data.gender as any || null,
        nationality: data.nationality || null,
        experience: data.experience,
        address: data.address || null,
        googleMapsUrl: data.googleMapsUrl || null,
        availableDays: data.availableDays || '',
        availableHours: data.availableHours || '',
        ownsCar: data.ownsCar ?? false,
        transportationAvailable: data.transportationAvailable ?? false,
        hourlyRate: data.hourlyRate,
        rating: data.rating ?? null,
        notes: data.notes || null,
        isActive: data.isActive ?? true,
        commissionModel: data.commissionModel || 'SEVENTY_THIRTY',
        teacherPercentage: data.commissionModel === 'SIXTYFIVE_THIRTYFIVE' ? 0.65 : 0.7,
        institutePercentage: data.commissionModel === 'SIXTYFIVE_THIRTYFIVE' ? 0.35 : 0.3,
        usesInstituteCar: data.usesInstituteCar ?? false,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });

    await prisma.user.update({
      where: { id: existing.userId },
      data: {
        phone: data.phone,
        firstName: data.name.split(' ')[0] || data.name,
        lastName: data.name.split(' ').slice(1).join(' ') || '',
      },
    });

    // Auto-recalculate payroll if commission model or institute car changed
    if (data.commissionModel !== existing.commissionModel || data.usesInstituteCar !== existing.usesInstituteCar) {
      const months = await prisma.lesson.findMany({
        where: { teacherId: id, status: 'COMPLETED' },
        select: { lessonDate: true },
        distinct: ['lessonDate'],
      });
      const processed = new Set<string>();
      for (const lesson of months) {
        const key = `${lesson.lessonDate.getFullYear()}-${lesson.lessonDate.getMonth() + 1}`;
        if (processed.has(key)) continue;
        processed.add(key);
        await recalculatePayrollForTeacher(id, lesson.lessonDate.getMonth() + 1, lesson.lessonDate.getFullYear(), auth.userId);
      }
    }

    await logActivity(auth.userId, 'UPDATE_TEACHER', 'Teacher', id);
    return NextResponse.json({ teacher });
  } catch (error) {
    console.error('Error updating teacher:', error);
    return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ['ADMIN']);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await prisma.teacher.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    await prisma.teacher.delete({ where: { id } });
    await prisma.user.delete({ where: { id: existing.userId } });

    await logActivity(auth.userId, 'DELETE_TEACHER', 'Teacher', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json({ error: 'Failed to delete teacher' }, { status: 500 });
  }
}
