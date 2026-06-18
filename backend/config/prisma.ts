// backend/config/prisma.ts
// Centralised Prisma client — single source of truth for DB access.
// Re-exports from app/lib/prisma.ts to avoid duplicating the singleton logic.

export { prisma, default } from '@/lib/prisma'
