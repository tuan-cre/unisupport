import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from '../files/files.service';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';

const mockPrisma = {
  attachment: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

const mockMinio = {
  upload: jest.fn(),
  delete: jest.fn(),
  getUrl: jest.fn(),
};

describe('FilesService', () => {
  let service: FilesService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MinioService, useValue: mockMinio },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upload', () => {
    it('should reject files over 20MB', async () => {
      const file = { size: 25 * 1024 * 1024, mimetype: 'text/plain', originalname: 'test.txt', buffer: Buffer.from('') } as Express.Multer.File;
      await expect(service.upload(file, 'user-id')).rejects.toThrow('File too large');
    });

    it('should reject blocked mime types', async () => {
      const file = { size: 1024, mimetype: 'text/html', originalname: 'page.html', buffer: Buffer.from('') } as Express.Multer.File;
      await expect(service.upload(file, 'user-id')).rejects.toThrow('File type not allowed');
    });

    it('should upload and create attachment record', async () => {
      const file = { size: 1024, mimetype: 'image/png', originalname: 'photo.png', buffer: Buffer.from('data') } as Express.Multer.File;
      mockMinio.upload.mockResolvedValue('https://minio/bucket/file.png');
      mockPrisma.attachment.create.mockResolvedValue({ id: 'att-id', originalName: 'photo.png' });

      const result = await service.upload(file, 'user-id');
      expect(result).toHaveProperty('id');
      expect(mockMinio.upload).toHaveBeenCalled();
      expect(prisma.attachment.create).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should throw if not owner', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: { name: 'user' } });
      mockPrisma.attachment.findUnique.mockResolvedValue({ id: 'att-id', uploadedById: 'other-user', ticketId: null });
      await expect(service.remove('att-id', 'my-user')).rejects.toThrow();
    });

    it('should delete attachment', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: { name: 'admin' } });
      mockPrisma.attachment.findUnique.mockResolvedValue({ id: 'att-id', uploadedById: 'my-user', ticketId: null, objectName: 'file.png' });
      mockMinio.delete.mockResolvedValue(undefined);
      mockPrisma.attachment.delete.mockResolvedValue({ id: 'att-id' });

      await service.remove('att-id', 'my-user');
      expect(mockPrisma.attachment.delete).toHaveBeenCalled();
    });
  });
});
