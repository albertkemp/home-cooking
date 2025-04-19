import { PrismaClient } from "@prisma/client";

// PrismaClient is attached to the `globalThis` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// In development, attach the PrismaClient to the globalThis object
// to prevent multiple instances during hot reloading
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
} 