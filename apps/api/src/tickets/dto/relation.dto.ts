import { IsString, IsOptional } from 'class-validator';

export class CreateRelationDto {
  @IsString()
  ticketId!: string;

  @IsOptional()
  @IsString()
  type?: string;
}
