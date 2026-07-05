import { prisma } from '@/lib/db';

export async function getStats() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalStudents,
    activeStudents,
    newStudentsThisMonth,
    totalTeachers,
    activeTeachers,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { status: 'ACTIVE' } }),
    prisma.student.count({
      where: { createdAt: { gte: firstDayOfMonth } },
    }),
    prisma.teacher.count(),
    prisma.teacher.count({ where: { isActive: true } }),
  ]);

  return {
    totalStudents,
    activeStudents,
    newStudentsThisMonth,
    activeTeachers,
  };
}

export async function getStudentGrowthData() {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const registrations = await prisma.student.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: { gte: sixMonthsAgo },
    },
    _count: {
      id: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const monthlyData = registrations.map((reg) => {
    const month = reg.createdAt.toLocaleString('default', {
      month: 'short',
    });

    return {
      month,
      registrations: reg._count.id,
    };
  });

  return monthlyData;
}
