import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const seed = async () => {
  console.log('🌱 Nothing to seed yet — add seed data here.');

  const users = await prisma.user.count();

  console.log(`✅ Done: ${users} users`);
};

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
