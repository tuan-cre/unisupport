import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { CreateLicenseDto } from './dto/create-license.dto';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../tickets/guards/permissions.decorator';
import { RolesGuard } from '../tickets/guards/roles.guard';

@ApiTags('Assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assets')
export class AssetsController {
  constructor(private assets: AssetsService) {}

  @ApiOperation({ summary: 'List all assets' })
  @Get()
  async findAll() {
    const data = await this.assets.findAll();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get asset by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.assets.findOne(id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Create an asset' })
  @Post()
  @RequirePermissions('user:manage')
  async create(@Body() dto: CreateAssetDto) {
    const data = await this.assets.create(dto);
    return { success: true, message: 'Asset created', data };
  }

  @ApiOperation({ summary: 'Update an asset' })
  @Patch(':id')
  @RequirePermissions('user:manage')
  async update(@Param('id') id: string, @Body() dto: UpdateAssetDto) {
    const data = await this.assets.update(id, dto);
    return { success: true, message: 'Asset updated', data };
  }

  @ApiOperation({ summary: 'Delete an asset' })
  @Delete(':id')
  @RequirePermissions('user:manage')
  async remove(@Param('id') id: string) {
    await this.assets.remove(id);
    return { success: true, message: 'Asset deleted' };
  }

  // --- Assignments ---
  @ApiOperation({ summary: 'Assign asset to user' })
  @Post(':id/assign/:userId')
  @RequirePermissions('user:manage')
  async assign(@Param('id') id: string, @Param('userId') userId: string) {
    const data = await this.assets.assign(id, userId);
    return { success: true, message: 'Asset assigned', data };
  }

  @ApiOperation({ summary: 'Unassign asset (return)' })
  @Patch('assignments/:assignmentId/unassign')
  @RequirePermissions('user:manage')
  async unassign(@Param('assignmentId') id: string) {
    const data = await this.assets.unassign(id);
    return { success: true, message: 'Asset unassigned', data };
  }

  // --- Licenses ---
  @ApiOperation({ summary: 'Create a software license' })
  @Post('licenses')
  @RequirePermissions('user:manage')
  async createLicense(@Body() dto: CreateLicenseDto) {
    const data = await this.assets.createLicense(dto);
    return { success: true, message: 'License created', data };
  }

  @ApiOperation({ summary: 'Update a software license' })
  @Patch('licenses/:id')
  @RequirePermissions('user:manage')
  async updateLicense(@Param('id') id: string, @Body() dto: Partial<CreateLicenseDto>) {
    const data = await this.assets.updateLicense(id, dto);
    return { success: true, message: 'License updated', data };
  }

  @ApiOperation({ summary: 'Delete a software license' })
  @Delete('licenses/:id')
  @RequirePermissions('user:manage')
  async removeLicense(@Param('id') id: string) {
    await this.assets.removeLicense(id);
    return { success: true, message: 'License deleted' };
  }

  // --- Checkout ---
  @ApiOperation({ summary: 'Checkout hardware' })
  @Post('checkouts')
  @RequirePermissions('user:manage')
  async checkout(@Body() dto: CreateCheckoutDto) {
    const data = await this.assets.checkout(dto);
    return { success: true, message: 'Hardware checked out', data };
  }

  @ApiOperation({ summary: 'Checkin hardware (return)' })
  @Patch('checkouts/:id/checkin')
  @RequirePermissions('user:manage')
  async checkin(@Param('id') id: string) {
    const data = await this.assets.checkin(id);
    return { success: true, message: 'Hardware checked in', data };
  }
}
