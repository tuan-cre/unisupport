import { IsString, IsOptional } from 'class-validator';

export class UpdateCalendarDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  hoursJson?: string;
}
