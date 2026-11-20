import { prisma } from '@al-milla/database'

export const getPrismaClient = () => prisma

export type { PrismaClient } from '@al-milla/database'

