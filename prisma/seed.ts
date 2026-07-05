import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.user.upsert({
    where: { phone: '1234567890' },
    update: {},
    create: {
      email: 'admin@alpha-institute.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'System',
      phone: '1234567890',
      role: 'ADMIN',
    },
  });

  console.log('Admin user created:', admin.phone);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
