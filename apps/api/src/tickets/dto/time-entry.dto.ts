import { IsInt, IsString, IsOptional, Min, Max } from 'class-validator';

export class CreateTimeEntryDto {
  @IsInt()
  @Min(1)
  @Max(1440)
  minutes!: number;

  @IsOptional()
  @IsString()
  description?: string;
}
