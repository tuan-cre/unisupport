import { IsString, IsOptional, IsEnum, IsInt, IsBoolean, Min } from 'class-validator';
import { TicketPriority } from '@prisma/client';

export class CreateSlaDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TicketPriority)
  priority!: TicketPriority;

  @IsInt()
  @Min(1)
  responseTime!: number;

  @IsInt()
  @Min(1)
  resolutionTime!: number;

  @IsOptional()
  @IsString()
  calendarId?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
