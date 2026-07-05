import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) { console.log('No admin found. Run prisma/seed.ts first.'); return; }

  const existing = await prisma.student.count();
  if (existing > 0) { console.log(`Already ${existing} students. Skipping.`); return; }

  const students = [
    { firstName: 'أحمد', lastName: 'محمد علي', email: 'ahmed@example.com', phone: '0555123456', dateOfBirth: '2000-05-15', address: 'الرياض، حي النخيل', gpa: 3.5 },
    { firstName: 'سارة', lastName: 'خالد عبدالله', email: 'sara@example.com', phone: '0555789012', dateOfBirth: '2001-08-22', address: 'جدة، حي الأندلس', gpa: 3.8 },
    { firstName: 'محمد', lastName: 'عمر الفهد', email: 'mohamed@example.com', phone: '0555345678', dateOfBirth: '1999-11-10', address: 'الدمام، حي العقربية', gpa: 2.9 },
    { firstName: 'نورة', lastName: 'فهد العنزي', email: 'noura@example.com', phone: '0555901234', dateOfBirth: '2002-03-08', address: 'مكة المكرمة، حي العوالي', gpa: 3.2 },
    { firstName: 'عبدالله', lastName: 'إبراهيم المطيري', email: 'abdullah@example.com', phone: '0555567890', dateOfBirth: '2000-12-25', address: 'الرياض، حي السويدي', gpa: 2.7 },
  ];

  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const user = await prisma.user.create({
      data: {
        email: s.email,
        phone: s.phone,
        password: '',
        firstName: s.firstName,
        lastName: s.lastName,
        role: 'RECEPTIONIST',
      },
    });

    await prisma.student.create({
      data: {
        userId: user.id,
        studentId: `STU-${String(i + 1).padStart(5, '0')}`,
        dateOfBirth: new Date(s.dateOfBirth),
        address: s.address,
        enrollmentDate: new Date('2026-01-15'),
        status: i < 3 ? 'ACTIVE' : i === 3 ? 'INACTIVE' : 'WITHDRAWN',
        gpa: s.gpa,
      },
    });

    console.log(`Created student: ${s.firstName} ${s.lastName}`);
  }

  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
