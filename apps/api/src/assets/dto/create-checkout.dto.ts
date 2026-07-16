import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateCheckoutDto {
  @IsString()
  assetId!: string;

  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  expectedReturnAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
