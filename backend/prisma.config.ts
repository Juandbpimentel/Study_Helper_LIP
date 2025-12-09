import 'dotenv/config';
import type { PrismaConfig } from 'prisma';
import { env } from 'prisma/config';

export default {
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
} satisfies PrismaConfig;
