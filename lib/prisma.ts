// Prisma client helper for PostgreSQL integration
// When DATABASE_URL is set, queries can be routed to PostgreSQL.

export async function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  try {
    // Dynamic import to allow compiling even if prisma generate hasn't run yet
    const prismaModule: Record<string, any> = await import('@prisma/client');
    const ClientConstructor = prismaModule.PrismaClient || prismaModule.default?.PrismaClient;
    if (ClientConstructor) {
      return new ClientConstructor();
    }
    return null;
  } catch (err) {
    console.warn('PrismaClient not initialized, using local persistent store:', err);
    return null;
  }
}

