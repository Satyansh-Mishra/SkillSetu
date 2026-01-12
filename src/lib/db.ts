/**
 * DATABASE CONNECTION
 * 
 * This file creates a SINGLE Prisma client instance
 * that's reused across your entire app.
 * 
 */

import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const databaseUrl = process.env.NODE_ENV === "development" as string ? process.env.DATABASE_URL_DEVELOPMENT : process.env.DATABASE_URL_PRODUCTION

const adapter = new PrismaPg({
  connectionString: databaseUrl,
})

// Extend global type to include prisma
declare global {
  var prisma: PrismaClient | undefined
}

/**
 * Create Prisma client with logging in development
 */
export const prisma = global.prisma || new PrismaClient({
  adapter
})

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

/**
 * Graceful shutdown
 * Disconnects from DB when app closes
 */
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

export default prisma