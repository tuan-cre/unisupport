import { IsString, IsOptional, IsEnum } from 'class-validator';
import { AssetType, AssetStatus } from '@prisma/client';

export class CreateAssetDto {
  @IsString()
  name!: string;

  @IsEnum(AssetType)
  type!: AssetType;

  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  purchaseDate?: string;

  @IsOptional()
  @IsString()
  warrantyExpiry?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  location?: string;
}
