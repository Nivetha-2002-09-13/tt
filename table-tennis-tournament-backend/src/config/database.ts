import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // prisma config override handled by `datasource db { url = ... }` in schema.prisma
});

export default prisma;




