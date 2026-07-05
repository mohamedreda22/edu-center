import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const p = new PrismaClient({ adapter });

  const users = await p.user.count();
  const students = await p.student.count();
  console.log({ users, students });

  const sample = await p.student.findFirst({ include: { user: true } });
  console.log(JSON.stringify(sample, null, 2));

  await p.$disconnect();
}

main();
