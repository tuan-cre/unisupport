import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const permissions = await Promise.all(
    ['ticket:read', 'ticket:write', 'ticket:assign', 'user:manage'].map((name) =>
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  const permMap = Object.fromEntries(permissions.map((p) => [p.name, p.id]));

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin' },
  });
  const agentRole = await prisma.role.upsert({
    where: { name: 'agent' },
    update: {},
    create: { name: 'agent' },
  });
  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: { name: 'user' },
  });

  await prisma.role.update({
    where: { id: adminRole.id },
    data: { permissions: { set: permissions.map((p) => ({ id: p.id })) } },
  });
  await prisma.role.update({
    where: { id: agentRole.id },
    data: {
      permissions: {
        set: [
          { id: permMap['ticket:read'] },
          { id: permMap['ticket:write'] },
          { id: permMap['ticket:assign'] },
        ],
      },
    },
  });
  await prisma.role.update({
    where: { id: userRole.id },
    data: {
      permissions: {
        set: [{ id: permMap['ticket:read'] }, { id: permMap['ticket:write'] }],
      },
    },
  });

  const adminExists = await prisma.user.findUnique({ where: { email: 'admin@unisupport.local' } });
  if (!adminExists) {
    await prisma.user.create({
      data: {
        email: 'admin@unisupport.local',
        firstName: 'Admin',
        lastName: 'User',
        passwordHash: await bcrypt.hash('admin123', 12),
        roleId: adminRole.id,
      },
    });
    console.log('Created admin user: admin@unisupport.local / admin123');
  }

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
