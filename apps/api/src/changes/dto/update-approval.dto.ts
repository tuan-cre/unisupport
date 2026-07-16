import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApprovalStatus } from '@prisma/client';

export class UpdateApprovalDto {
  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  approverId?: string;

  @IsOptional()
  @IsString()
  role?: string;
}
