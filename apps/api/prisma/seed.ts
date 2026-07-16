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
        passwordHash: await bcrypt.hash('Admin@123!', 12),
        roleId: adminRole.id,
      },
    });
    console.log('Created admin user: admin@unisupport.local / Admin@123!');
  } else {
    await prisma.user.update({
      where: { email: 'admin@unisupport.local' },
      data: { passwordHash: await bcrypt.hash('Admin@123!', 12), roleId: adminRole.id },
    });
    console.log('Updated admin user password');
  }

  const agentExists = await prisma.user.findUnique({ where: { email: 'agent@unisupport.local' } });
  if (!agentExists) {
    await prisma.user.create({
      data: {
        email: 'agent@unisupport.local',
        firstName: 'Agent',
        lastName: 'User',
        passwordHash: await bcrypt.hash('Agent@123!', 12),
        roleId: agentRole.id,
      },
    });
    console.log('Created agent user: agent@unisupport.local / Agent@123!');
  }

  const userExists = await prisma.user.findUnique({ where: { email: 'user@unisupport.local' } });
  if (!userExists) {
    await prisma.user.create({
      data: {
        email: 'user@unisupport.local',
        firstName: 'Regular',
        lastName: 'User',
        passwordHash: await bcrypt.hash('User@123!', 12),
        roleId: userRole.id,
      },
    });
    console.log('Created regular user: user@unisupport.local / User@123!');
  }

  const dept = await prisma.department.upsert({
    where: { name: 'IT Support' },
    update: {},
    create: { name: 'IT Support' },
  });
  console.log('Created department: IT Support');

  const sla = await prisma.sla.upsert({
    where: { name: 'Standard' },
    update: {},
    create: {
      name: 'Standard',
      priority: 'MEDIUM',
      responseTime: 4,
      resolutionTime: 24,
      isDefault: true,
    },
  });
  console.log('Created SLA: Standard');

  const category = await prisma.articleCategory.upsert({
    where: { name: 'Getting Started' },
    update: {},
    create: { name: 'Getting Started', slug: 'getting-started' },
  });
  console.log('Created article category: Getting Started');

  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@unisupport.local' } });
  if (adminUser) {
    const article = await prisma.article.findFirst({ where: { slug: 'welcome-to-unisupport' } });
    if (!article) {
      await prisma.article.create({
        data: {
          title: 'Welcome to UniSupport',
          slug: 'welcome-to-unisupport',
          content: 'Welcome to UniSupport, the university IT help desk platform. Use this knowledge base to find answers to common questions and issues.',
          categoryId: category.id,
          createdById: adminUser.id,
          published: true,
        },
      });
      console.log('Created article: Welcome to UniSupport');
    }
  }

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
