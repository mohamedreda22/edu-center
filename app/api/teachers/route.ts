import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activityLog';
import { teacherSchema } from '@/lib/validations/teacher';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';

  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { employeeId: { contains: search } },
      { user: { firstName: { contains: search } } },
      { user: { lastName: { contains: search } } },
      { subjects: { contains: search } },
    ];
  }

  try {
    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.teacher.count({ where }),
    ]);

    return NextResponse.json({
      teachers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ['ADMIN', 'RECEPTIONIST']);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = teacherSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const user = await prisma.user.create({
      data: {
        email: `teacher-${data.phone}@alpha-institute.com`,
        phone: data.phone,
        password: '',
        firstName: data.name.split(' ')[0] || data.name,
        lastName: data.name.split(' ').slice(1).join(' ') || '',
        role: 'TEACHER',
      },
    });

    const count = await prisma.teacher.count();
    const employeeId = `TCH-${String(count + 1).padStart(4, '0')}`;

    const teacher = await prisma.teacher.create({
      data: {
        userId: user.id,
        employeeId,
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

    await logActivity(auth.userId, 'CREATE_TEACHER', 'Teacher', teacher.id);
    return NextResponse.json({ teacher }, { status: 201 });
  } catch (error) {
    console.error('Error creating teacher:', error);
    return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 });
  }
}
