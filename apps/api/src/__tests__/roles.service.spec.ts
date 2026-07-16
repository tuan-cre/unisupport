import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from '../roles/roles.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  role: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

describe('RolesService', () => {
  let service: RolesService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all roles', async () => {
      const mockRoles = [
        { id: '1', name: 'admin', permissions: [], users: [], createdAt: new Date() },
        { id: '2', name: 'agent', permissions: [], users: [], createdAt: new Date() },
      ];
      mockPrisma.role.findMany.mockResolvedValue(mockRoles);

      const result = await service.findAll();
      expect(result).toEqual(mockRoles);
    });
  });

  describe('create', () => {
    it('should create a role with permissions', async () => {
      const dto = { name: 'tech', permissionIds: [] };
      mockPrisma.role.create.mockResolvedValue({ id: 'role-id', ...dto });

      const result = await service.create(dto);
      expect(result).toHaveProperty('id');
      expect(prisma.role.create).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should throw if role has assigned users', async () => {
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-id', name: 'test' });
      mockPrisma.user.count.mockResolvedValue(2);
      await expect(service.remove('role-id')).rejects.toThrow();
    });

    it('should delete if no users assigned', async () => {
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-id', name: 'test' });
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.role.delete.mockResolvedValue({ id: 'role-id' });

      await service.remove('role-id');
      expect(mockPrisma.role.delete).toHaveBeenCalledWith({ where: { id: 'role-id' } });
    });
  });
});
