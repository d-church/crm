import { hash } from 'argon2';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/** Dev password for every seeded account. Override with SEED_PASSWORD. */
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? '123456';

const ACCOUNTS = [
  { email: 'igornovoseltsev91@gmail.com', name: 'Ігор Новосельцев' },
  { email: 'a.tata4.26@gmail.com', name: 'Андрій Татач' },
  { email: 'owngameplay@gmail.com', name: 'Юрій Хвищук' },
];

const seed = async () => {
  console.log(`🌱 Seeding ${ACCOUNTS.length} accounts…`);

  for (const account of ACCOUNTS) {
    const existing = await prisma.user.findUnique({ where: { email: account.email } });

    // An existing password may have been changed on purpose — never overwrite it.
    if (existing) {
      console.log(`   ↷ ${account.email} — вже існує, пропускаю`);
      continue;
    }

    await prisma.user.create({
      data: { ...account, password: await hash(SEED_PASSWORD) },
    });

    console.log(`   ✚ ${account.email} — ${account.name}`);
  }

  const users = await prisma.user.count();

  console.log(`✅ Done: ${users} users`);
};

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
