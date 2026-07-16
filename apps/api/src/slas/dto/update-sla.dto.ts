import { IsString, IsOptional, IsEnum, IsInt, IsBoolean, Min } from 'class-validator';
import { TicketPriority } from '@prisma/client';

export class UpdateSlaDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsInt()
  @Min(1)
  responseTime?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  resolutionTime?: number;

  @IsOptional()
  @IsString()
  calendarId?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
