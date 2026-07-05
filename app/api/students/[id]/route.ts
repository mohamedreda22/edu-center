import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activityLog';
import { studentSchema } from '@/lib/validations/student';

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

    const existing = await prisma.student.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = studentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const student = await prisma.student.update({
      where: { id },
      data: {
        address: data.address,
        grade: data.grade,
        subjects: data.subjects,
        parentName: data.parentName || null,
        parentPhone: data.parentPhone || null,
        whatsapp: data.whatsapp || null,
        area: data.area || null,
        googleMapsUrl: data.googleMapsUrl || null,
        school: data.school || null,
        preferredTeacherGender: data.preferredTeacherGender as any || null,
        preferredSchedule: data.preferredSchedule || null,
        notes: data.notes || null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
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

    await logActivity(auth.userId, 'UPDATE_STUDENT', 'Student', id);

    return NextResponse.json({ student });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
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

    const existing = await prisma.student.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (existing.status === 'WITHDRAWN') {
      return NextResponse.json(
        { error: 'Student is already archived' },
        { status: 400 }
      );
    }

    const student = await prisma.student.update({
      where: { id },
      data: { status: 'WITHDRAWN' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    await logActivity(auth.userId, 'ARCHIVE_STUDENT', 'Student', id);

    return NextResponse.json({ student });
  } catch (error) {
    console.error('Error archiving student:', error);
    return NextResponse.json(
      { error: 'Failed to archive student' },
      { status: 500 }
    );
  }
}
