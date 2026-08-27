import './src/config/load-env';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    // Migrations and Studio go through the session-mode pooler; the app itself
    // talks to the transaction-mode pooler via DATABASE_URL.
    url: process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'],
  },
});
