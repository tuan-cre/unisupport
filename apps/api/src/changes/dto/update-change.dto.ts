import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ChangeStatus, TicketPriority } from '@prisma/client';

export class UpdateChangeDto {
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ChangeStatus)
  status?: ChangeStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsString()
  riskLevel?: string;

  @IsOptional()
  @IsString()
  problemId?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  plannedStart?: string;

  @IsOptional()
  @IsString()
  plannedEnd?: string;

  @IsOptional()
  @IsString()
  actualStart?: string;

  @IsOptional()
  @IsString()
  actualEnd?: string;
}
