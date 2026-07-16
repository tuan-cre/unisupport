import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApprovalStatus } from '@prisma/client';

export class CreateApprovalDto {
  @IsOptional()
  @IsString()
  approverId?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  stepOrder?: number;

  @IsOptional()
  @IsString()
  chainName?: string;
}
