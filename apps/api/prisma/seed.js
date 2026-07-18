/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const PASSWORD_HASH = bcrypt.hashSync('Password123!', 12);

async function main() {
  console.log('Seeding database...');

  // Permissions
  const permissionNames = [
    'user:manage',
    'ticket:manage',
    'ticket:assign',
    'ticket:comment',
    'kb:manage',
    'sla:manage',
    'report:view',
    'department:manage',
    'role:manage',
    'problem:manage',
    'change:manage',
    'asset:manage',
    'chat:manage',
    'notification:manage',
  ];
  const permissions = {};
  for (const name of permissionNames) {
    permissions[name] = await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      permissions: { connect: Object.values(permissions).map((p) => ({ id: p.id })) },
    },
  });

  const agentRole = await prisma.role.upsert({
    where: { name: 'agent' },
    update: {},
    create: {
      name: 'agent',
      permissions: {
        connect: [
          'ticket:manage',
          'ticket:assign',
          'ticket:comment',
          'kb:manage',
          'report:view',
          'chat:manage',
        ].map((n) => ({ id: permissions[n].id })),
      },
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      permissions: {
        connect: ['ticket:comment'].map((n) => ({ id: permissions[n].id })),
      },
    },
  });

  // Departments
  const departments = {};
  for (const name of ['IT Support', 'Network', 'Software Development', 'HR', 'Finance']) {
    departments[name] = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@unisupport.vn' },
    update: {},
    create: {
      email: 'admin@unisupport.vn',
      passwordHash: PASSWORD_HASH,
      firstName: 'Admin',
      lastName: 'User',
      roleId: adminRole.id,
      departmentId: departments['IT Support'].id,
      emailVerifiedAt: new Date(),
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: 'agent@unisupport.vn' },
    update: {},
    create: {
      email: 'agent@unisupport.vn',
      passwordHash: PASSWORD_HASH,
      firstName: 'Nguyen',
      lastName: 'Agent',
      roleId: agentRole.id,
      departmentId: departments['IT Support'].id,
      emailVerifiedAt: new Date(),
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'user1@unisupport.vn' },
    update: {},
    create: {
      email: 'user1@unisupport.vn',
      passwordHash: PASSWORD_HASH,
      firstName: 'Tran',
      lastName: 'Student',
      roleId: userRole.id,
      departmentId: departments['Software Development'].id,
      emailVerifiedAt: new Date(),
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@unisupport.vn' },
    update: {},
    create: {
      email: 'user2@unisupport.vn',
      passwordHash: PASSWORD_HASH,
      firstName: 'Le',
      lastName: 'Faculty',
      roleId: userRole.id,
      departmentId: departments['HR'].id,
      emailVerifiedAt: new Date(),
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'user3@unisupport.vn' },
    update: {},
    create: {
      email: 'user3@unisupport.vn',
      passwordHash: PASSWORD_HASH,
      firstName: 'Pham',
      lastName: 'Staff',
      roleId: userRole.id,
      departmentId: departments['Finance'].id,
      emailVerifiedAt: new Date(),
    },
  });

  console.log('Users created');

  // SLAs
  const slas = {};
  for (const [name, data] of Object.entries({
    'Critical SLA': { priority: 'URGENT', responseTime: 15, resolutionTime: 240, isDefault: false },
    'High SLA': { priority: 'HIGH', responseTime: 30, resolutionTime: 480, isDefault: false },
    'Default SLA': { priority: 'MEDIUM', responseTime: 60, resolutionTime: 1440, isDefault: true },
    'Low SLA': { priority: 'LOW', responseTime: 240, resolutionTime: 4320, isDefault: false },
  })) {
    slas[name] = await prisma.sla.upsert({
      where: { name },
      update: {},
      create: { name, ...data },
    });
  }

  // Tags
  const tags = {};
  for (const [name, color] of [
    ['bug', '#ef4444'],
    ['feature', '#3b82f6'],
    ['urgent', '#f97316'],
    ['network', '#8b5cf6'],
    ['hardware', '#06b6d4'],
    ['software', '#10b981'],
    ['email', '#ec4899'],
    ['access', '#f59e0b'],
  ]) {
    tags[name] = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name, color },
    });
  }

  // KB Categories & Articles
  const kbCategories = {};
  for (const name of [
    'Getting Started',
    'Network & WiFi',
    'Software & Applications',
    'Hardware',
    'Account & Access',
  ]) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    kbCategories[name] = await prisma.articleCategory.upsert({
      where: { name },
      update: {},
      create: { name, slug, description: `Articles about ${name.toLowerCase()}` },
    });
  }

  const articles = [
    {
      title: 'How to Connect to Campus WiFi',
      slug: 'connect-campus-wifi',
      category: 'Network & WiFi',
      content:
        'Step 1: Open WiFi settings.\nStep 2: Select "UniSupport-Edu" network.\nStep 3: Enter your university credentials.\nStep 4: Accept the certificate.\n\nIf you have issues, forget the network and reconnect.',
    },
    {
      title: 'Setting Up Your University Email',
      slug: 'setup-university-email',
      category: 'Account & Access',
      content:
        'Your email is yourstudentid@unisupport.edu.vn\nPassword: Same as your portal password.\n\nTo setup on phone:\n1. Download Outlook or Gmail app\n2. Enter your email\n3. Use IMAP: imap.unisupport.edu.vn\n4. Use SMTP: smtp.unisupport.edu.vn',
    },
    {
      title: 'Installing Required Software',
      slug: 'install-required-software',
      category: 'Software & Applications',
      content:
        'All students must install:\n- Microsoft Office 365 (free with student email)\n- Visual Studio Code\n- Node.js LTS version\n- Git\n\nVisit software.unisupport.edu.vn for download links.',
    },
    {
      title: 'Reporting a Hardware Issue',
      slug: 'report-hardware-issue',
      category: 'Hardware',
      content:
        'Before submitting a ticket:\n1. Try restarting the device\n2. Check all cable connections\n3. Note the asset tag number (usually on a sticker)\n\nSubmit a ticket with:- Asset tag number\n- Description of the issue\n- When it started happening',
    },
    {
      title: 'Password Reset Instructions',
      slug: 'password-reset',
      category: 'Account & Access',
      content:
        'If you forgot your password:\n1. Go to portal.unisupport.edu.vn\n2. Click "Forgot Password"\n3. Enter your student/staff ID\n4. Check your recovery email\n5. Follow the link to reset\n\nIf you cannot access your recovery email, visit the IT helpdesk in person with your student ID.',
    },
    {
      title: 'VPN Setup for Remote Access',
      slug: 'vpn-setup',
      category: 'Network & WiFi',
      content:
        'To access university resources from home:\n\n1. Download GlobalProtect from vpn.unisupport.edu.vn\n2. Install and open the application\n3. Portal: vpn.unisupport.edu.vn\n4. Login with your university credentials\n\nSupported: Windows, macOS, Linux, iOS, Android',
    },
  ];

  for (const a of articles) {
    await prisma.article.upsert({
      where: { slug: a.slug },
      update: {},
      create: {
        title: a.title,
        slug: a.slug,
        content: a.content,
        categoryId: kbCategories[a.category].id,
        createdById: admin.id,
        published: true,
      },
    });
  }

  console.log('KB articles created');

  // Tickets
  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 86400000);
  const hoursAgo = (h) => new Date(now.getTime() - h * 3600000);

  const ticketData = [
    {
      subject: 'Cannot connect to campus WiFi',
      description:
        'My laptop keeps failing to connect to UniSupport-Edu. I get "Authentication error" every time. I have tried forgetting the network and reconnecting.',
      status: 'OPEN',
      priority: 'HIGH',
      requesterId: user1.id,
      departmentId: departments['Network'].id,
      tagNames: ['network', 'bug'],
      createdAt: daysAgo(5),
    },
    {
      subject: 'Request for MATLAB license',
      description:
        'I need MATLAB for my engineering coursework. Can you provide a student license?',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      requesterId: user1.id,
      assigneeId: agent.id,
      departmentId: departments['Software Development'].id,
      tagNames: ['software'],
      createdAt: daysAgo(4),
    },
    {
      subject: 'Printer not working in Room 204',
      description:
        'The HP LaserJet in Room 204 has been showing "Paper Jam" for 2 days. I have checked and there is no jam.',
      status: 'OPEN',
      priority: 'MEDIUM',
      requesterId: user2.id,
      departmentId: departments['IT Support'].id,
      tagNames: ['hardware'],
      createdAt: daysAgo(3),
    },
    {
      subject: 'Cannot access student portal',
      description:
        'I am getting a 403 error when trying to log into portal.unisupport.edu.vn. My account was working yesterday.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      requesterId: user3.id,
      assigneeId: agent.id,
      departmentId: departments['IT Support'].id,
      tagNames: ['access', 'urgent'],
      createdAt: daysAgo(2),
    },
    {
      subject: 'Blue screen on lab computer LAB-105',
      description:
        'Computer in Lab 105 keeps crashing with BSOD. Error code: IRQL_NOT_LESS_OR_EQUAL. This has happened 3 times today.',
      status: 'OPEN',
      priority: 'URGENT',
      requesterId: user2.id,
      departmentId: departments['IT Support'].id,
      tagNames: ['hardware', 'urgent'],
      createdAt: daysAgo(1),
    },
    {
      subject: 'Request new software installation',
      description:
        'I need Docker Desktop installed on my workstation for the software engineering course.',
      status: 'RESOLVED',
      priority: 'LOW',
      requesterId: user1.id,
      assigneeId: agent.id,
      departmentId: departments['Software Development'].id,
      tagNames: ['software'],
      createdAt: daysAgo(10),
      resolvedAt: daysAgo(8),
    },
    {
      subject: 'Email not syncing on phone',
      description:
        'My university email stopped syncing on my iPhone 2 days ago. Desktop Outlook works fine.',
      status: 'RESOLVED',
      priority: 'MEDIUM',
      requesterId: user3.id,
      assigneeId: agent.id,
      departmentId: departments['IT Support'].id,
      tagNames: ['email'],
      createdAt: daysAgo(7),
      resolvedAt: daysAgo(5),
    },
    {
      subject: 'Projector not displaying in Hall A',
      description:
        "The projector in Hall A shows a blue screen. HDMI cable seems fine. Need it fixed before tomorrow's presentation.",
      status: 'CLOSED',
      priority: 'HIGH',
      requesterId: user2.id,
      assigneeId: admin.id,
      departmentId: departments['IT Support'].id,
      tagNames: ['hardware'],
      createdAt: daysAgo(15),
      resolvedAt: daysAgo(14),
      closedAt: daysAgo(13),
    },
    {
      subject: 'Request VPN access for thesis research',
      description:
        'I need VPN access to connect to the university database from home for my thesis research. My student ID is SV2024001.',
      status: 'PENDING',
      priority: 'LOW',
      requesterId: user1.id,
      assigneeId: agent.id,
      departmentId: departments['Network'].id,
      tagNames: ['access', 'network'],
      createdAt: daysAgo(6),
    },
    {
      subject: 'Slow internet in Library Building',
      description:
        'The WiFi in the library building has been extremely slow for the past week. Download speeds are less than 1 Mbps.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      requesterId: user3.id,
      assigneeId: admin.id,
      departmentId: departments['Network'].id,
      tagNames: ['network', 'urgent'],
      createdAt: daysAgo(4),
    },
    {
      subject: 'License expired for Adobe Photoshop',
      description:
        'My Adobe Photoshop license shows as expired. I need it for the graphic design class. Can you renew it?',
      status: 'OPEN',
      priority: 'MEDIUM',
      requesterId: user2.id,
      departmentId: departments['Software Development'].id,
      tagNames: ['software'],
      createdAt: hoursAgo(8),
    },
    {
      subject: 'Cannot print to color printer',
      description:
        'The color printer on 3rd floor only prints in black and white. I selected color printing option but it ignores it.',
      status: 'OPEN',
      priority: 'LOW',
      requesterId: user1.id,
      departmentId: departments['IT Support'].id,
      tagNames: ['hardware'],
      createdAt: hoursAgo(3),
    },
  ];

  const createdTickets = [];
  for (const td of ticketData) {
    const { tagNames, ...data } = td;
    const ticket = await prisma.ticket.create({
      data: {
        ...data,
        firstResponseAt: data.assigneeId ? new Date(data.createdAt.getTime() + 3600000) : null,
        tags: tagNames ? { create: tagNames.map((t) => ({ tagId: tags[t].id })) } : undefined,
      },
    });
    createdTickets.push(ticket);
  }

  console.log(`${createdTickets.length} tickets created`);

  // Comments on some tickets
  await prisma.comment.createMany({
    data: [
      {
        content:
          'I have checked the WiFi access point in Building A. It seems to be functioning normally. Can you try forgetting the network and reconnecting?',
        ticketId: createdTickets[0].id,
        authorId: agent.id,
        isInternal: false,
        createdAt: daysAgo(4),
      },
      {
        content:
          "I tried that but still getting the same error. My friend's laptop connects fine to the same network.",
        ticketId: createdTickets[0].id,
        authorId: user1.id,
        isInternal: false,
        createdAt: daysAgo(4),
      },
      {
        content: 'What is your laptop model and OS? This could be a driver issue.',
        ticketId: createdTickets[0].id,
        authorId: agent.id,
        isInternal: false,
        createdAt: daysAgo(3),
      },
      {
        content: 'Dell XPS 13, Windows 11. I updated the WiFi driver yesterday but still the same.',
        ticketId: createdTickets[0].id,
        authorId: user1.id,
        isInternal: false,
        createdAt: daysAgo(3),
      },
      {
        content:
          'Internal note: This might be related to the RADIUS server issue we had last week. Check with network team.',
        ticketId: createdTickets[0].id,
        authorId: agent.id,
        isInternal: true,
        createdAt: daysAgo(3),
      },

      {
        content:
          'MATLAB license request has been submitted to the vendor. Expected turnaround is 2-3 business days.',
        ticketId: createdTickets[1].id,
        authorId: agent.id,
        isInternal: false,
        createdAt: daysAgo(3),
      },
      {
        content: 'Thanks! I will wait for the update.',
        ticketId: createdTickets[1].id,
        authorId: user1.id,
        isInternal: false,
        createdAt: daysAgo(3),
      },

      {
        content:
          'I have checked the printer. There was a small piece of paper stuck in the rollers that was not visible from the outside. Cleared it and the printer is working now.',
        ticketId: createdTickets[2].id,
        authorId: agent.id,
        isInternal: false,
        createdAt: daysAgo(2),
      },
      {
        content: 'Thank you so much! It is printing fine now.',
        ticketId: createdTickets[2].id,
        authorId: user2.id,
        isInternal: false,
        createdAt: daysAgo(2),
      },

      {
        content:
          'Your account was temporarily locked due to too many failed login attempts. I have unlocked it. Please try again.',
        ticketId: createdTickets[3].id,
        authorId: agent.id,
        isInternal: false,
        createdAt: hoursAgo(20),
      },
      {
        content: 'I can login now. Thank you!',
        ticketId: createdTickets[3].id,
        authorId: user3.id,
        isInternal: false,
        createdAt: hoursAgo(18),
      },
    ],
  });

  console.log('Comments created');

  // Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: user1.id,
        type: 'ticket_update',
        title: 'Ticket Updated',
        message: 'Your ticket "Cannot connect to campus WiFi" has a new comment.',
        link: `/tickets/${createdTickets[0].id}`,
      },
      {
        userId: user1.id,
        type: 'ticket_update',
        title: 'Ticket Updated',
        message: 'Your ticket "Request for MATLAB license" is now In Progress.',
        link: `/tickets/${createdTickets[1].id}`,
      },
      {
        userId: agent.id,
        type: 'ticket_assigned',
        title: 'Ticket Assigned',
        message: 'You have been assigned to "Request for MATLAB license".',
        link: `/tickets/${createdTickets[1].id}`,
      },
      {
        userId: admin.id,
        type: 'ticket_created',
        title: 'New Ticket',
        message: 'New urgent ticket: "Blue screen on lab computer LAB-105"',
        link: `/tickets/${createdTickets[4].id}`,
      },
      {
        userId: user3.id,
        type: 'ticket_update',
        title: 'Ticket Resolved',
        message: 'Your ticket "Email not syncing on phone" has been resolved.',
        link: `/tickets/${createdTickets[6].id}`,
      },
    ],
  });

  console.log('Notifications created');
  console.log('Seed complete!');
  console.log('\n=== TEST ACCOUNTS ===');
  console.log('Password for all: Password123!');
  console.log('');
  console.log('Admin:  admin@unisupport.vn');
  console.log('Agent:  agent@unisupport.vn');
  console.log('User 1: user1@unisupport.vn');
  console.log('User 2: user2@unisupport.vn');
  console.log('User 3: user3@unisupport.vn');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
