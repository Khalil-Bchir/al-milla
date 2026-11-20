import { PrismaClient } from '@prisma/client';

if (!process.env['DATABASE_URL'] && process.env['POSTGRES_PRISMA_URL']) {
  process.env['DATABASE_URL'] = process.env['POSTGRES_PRISMA_URL'];
}
if (!process.env['DIRECT_URL'] && process.env['POSTGRES_URL_NON_POOLING']) {
  process.env['DIRECT_URL'] = process.env['POSTGRES_URL_NON_POOLING'];
}

declare global {
  var prisma: PrismaClient | undefined;
}
export const prisma = globalThis.prisma || new PrismaClient();
if (process.env['NODE_ENV'] !== 'production') globalThis.prisma = prisma;
export * from '@prisma/client';
