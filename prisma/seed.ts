import { INITIAL_SECTORS, INITIAL_QUESTIONS, INITIAL_USERS, INITIAL_APP_CONFIG } from '../lib/initial-data';
import { getPrismaClient } from '../lib/prisma';
import { loadStore, saveStore } from '../lib/quiz-service';

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Seed local file/memory store
  const store = loadStore();
  store.sectors = [...INITIAL_SECTORS];
  store.questions = [...INITIAL_QUESTIONS];
  store.users = [...INITIAL_USERS];
  store.config = { ...INITIAL_APP_CONFIG };
  saveStore(store);
  console.log('✅ Local store seeded with initial sectors, questions, and admin user.');

  // 2. If PostgreSQL database is connected, seed Prisma models
  const prisma = await getPrismaClient();
  if (prisma) {
    const p: Record<string, any> = prisma;
    try {
      // Seed AppConfig
      await p.appConfig.upsert({
        where: { id: 'default' },
        update: {},
        create: INITIAL_APP_CONFIG,
      });

      // Seed Users
      for (const u of INITIAL_USERS) {
        await p.user.upsert({
          where: { email: u.email },
          update: { role: u.role, name: u.name },
          create: u,
        });
      }

      // Seed Sectors
      for (const s of INITIAL_SECTORS) {
        await p.sector.upsert({
          where: { name: s.name },
          update: { active: s.active },
          create: s,
        });
      }

      // Seed Questions
      for (const q of INITIAL_QUESTIONS) {
        await p.question.upsert({
          where: { id: q.id },
          update: q,
          create: q,
        });
      }
      console.log('✅ PostgreSQL seeded via Prisma successfully.');
    } catch (dbError) {
      console.warn('Note: Prisma PostgreSQL seed skipped (no live DB connection):', dbError);
    } finally {
      await p.$disconnect?.();
    }
  }

  console.log('🎉 Seeding completed!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
