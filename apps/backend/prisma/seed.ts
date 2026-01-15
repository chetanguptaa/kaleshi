// Seed script to see the dev database

import * as bcrypt from 'bcrypt';
import { PrismaClient } from 'generated/prisma/client';
import { PrismaBetterSqlite3 } from 'node_modules/@prisma/adapter-better-sqlite3/dist/index.mjs';

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: 'file:../data/dev.db',
  }),
});

async function main() {
  const [commonRole, adminRole] = await Promise.all([
    prisma.role.upsert({
      where: { name: 'COMMON' },
      update: {},
      create: { name: 'COMMON' },
    }),
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN' },
    }),
  ]);
  const adminEmail = 'admin@example.com';
  const adminPassword = '12345678';
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Primary Admin',
      email: adminEmail,
      password: passwordHash,
      userRoles: {
        create: {
          roleId: adminRole.id,
        },
      },
    },
  });
  console.log('Seed complete:');
  console.log('Roles:', { commonRole, adminRole });
  console.log('Admin user:', adminUser.email);
  console.log('Default password:', adminPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
