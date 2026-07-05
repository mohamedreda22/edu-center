import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activityLog';
import { studentSchema } from '@/lib/validations/student';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);

  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (status && ['ACTIVE', 'INACTIVE', 'WITHDRAWN'].includes(status)) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { studentId: { contains: search } },
      { user: { firstName: { contains: search } } },
      { user: { lastName: { contains: search } } },
      { user: { email: { contains: search } } },
      { user: { phone: { contains: search } } },
      { parentName: { contains: search } },
      { parentPhone: { contains: search } },
      { area: { contains: search } },
      { school: { contains: search } },
      { grade: { contains: search } },
      { subjects: { contains: search } },
    ];
  }

  try {
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
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
          _count: {
            select: { lessons: true, payments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({
      students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ['ADMIN', 'RECEPTIONIST']);

  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = studentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const user = await prisma.user.create({
      data: {
        email: `student-${data.phone}@institute.local`,
        phone: data.phone,
        password: '',
        firstName: data.name.split(' ')[0] || data.name,
        lastName: data.name.split(' ').slice(1).join(' ') || '',
        role: 'RECEPTIONIST',
      },
    });

    const count = await prisma.student.count();
    const studentId = `STU-${String(count + 1).padStart(5, '0')}`;

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        studentId,
        dateOfBirth: new Date(),
        address: data.address,
        enrollmentDate: new Date(),
        status: 'ACTIVE',
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

    await logActivity(auth.userId, 'CREATE_STUDENT', 'Student', student.id);

    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}
