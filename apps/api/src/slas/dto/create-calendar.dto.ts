import { IsString, IsOptional } from 'class-validator';

export class CreateCalendarDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  hoursJson?: string;
}
