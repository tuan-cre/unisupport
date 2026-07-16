import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { CreateLicenseDto } from './dto/create-license.dto';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  // --- Assets ---
  async findAll() {
    return this.prisma.asset.findMany({
      include: {
        assignments: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
        licenses: true,
        checkouts: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
        _count: { select: { checkouts: true, licenses: true, assignments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        assignments: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
        licenses: true,
        checkouts: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
      },
    });
    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
  }

  async create(dto: CreateAssetDto) {
    return this.prisma.asset.create({
      data: {
        ...dto,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        warrantyExpiry: dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : undefined,
      },
    });
  }

  async update(id: string, dto: UpdateAssetDto) {
    await this.findOne(id);
    return this.prisma.asset.update({
      where: { id },
      data: {
        ...dto,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        warrantyExpiry: dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const activeAssignments = await this.prisma.assetAssignment.count({ where: { assetId: id, returnedAt: null } });
    if (activeAssignments > 0) throw new ConflictException('Cannot delete asset with active assignments');
    const activeCheckouts = await this.prisma.hardwareCheckout.count({ where: { assetId: id, returnedAt: null } });
    if (activeCheckouts > 0) throw new ConflictException('Cannot delete asset with active checkouts');
    await this.prisma.asset.delete({ where: { id } });
    return { message: 'Asset deleted' };
  }

  // --- Assignments ---
  async assign(assetId: string, userId: string) {
    await this.findOne(assetId);
    const assignment = await this.prisma.assetAssignment.create({ data: { assetId, userId } });
    await this.prisma.asset.update({ where: { id: assetId }, data: { status: 'ASSIGNED' } });
    return assignment;
  }

  async unassign(assignmentId: string) {
    const a = await this.prisma.assetAssignment.findUnique({ where: { id: assignmentId } });
    if (!a) throw new NotFoundException('Assignment not found');
    const result = await this.prisma.assetAssignment.update({
      where: { id: assignmentId },
      data: { returnedAt: new Date() },
    });
    await this.prisma.asset.update({ where: { id: a.assetId }, data: { status: 'AVAILABLE' } });
    return result;
  }

  // --- Software Licenses ---
  async createLicense(dto: CreateLicenseDto) {
    if (dto.assetId) await this.findOne(dto.assetId);
    return this.prisma.softwareLicense.create({
      data: {
        ...dto,
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : undefined,
      },
    });
  }

  async updateLicense(id: string, dto: Partial<CreateLicenseDto>) {
    const lic = await this.prisma.softwareLicense.findUnique({ where: { id } });
    if (!lic) throw new NotFoundException('License not found');
    return this.prisma.softwareLicense.update({
      where: { id },
      data: {
        ...dto,
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : undefined,
      },
    });
  }

  async removeLicense(id: string) {
    const lic = await this.prisma.softwareLicense.findUnique({ where: { id } });
    if (!lic) throw new NotFoundException('License not found');
    await this.prisma.softwareLicense.delete({ where: { id } });
    return { message: 'License deleted' };
  }

  // --- Hardware Checkout ---
  async checkout(dto: CreateCheckoutDto) {
    const asset = await this.prisma.asset.findUnique({ where: { id: dto.assetId } });
    if (!asset) throw new NotFoundException('Asset not found');
    if (asset.status !== 'AVAILABLE') throw new ConflictException('Asset is not available for checkout');
    return this.prisma.hardwareCheckout.create({
      data: {
        ...dto,
        expectedReturnAt: dto.expectedReturnAt ? new Date(dto.expectedReturnAt) : undefined,
      },
    });
  }

  async checkin(checkoutId: string) {
    const co = await this.prisma.hardwareCheckout.findUnique({ where: { id: checkoutId } });
    if (!co) throw new NotFoundException('Checkout not found');
    const result = await this.prisma.hardwareCheckout.update({
      where: { id: checkoutId },
      data: { returnedAt: new Date() },
    });
    await this.prisma.asset.update({ where: { id: co.assetId }, data: { status: 'AVAILABLE' } });
    return result;
  }
}
