import { IsString, MinLength } from 'class-validator';

export class VerifyMfaDto {
  @IsString()
  mfaToken!: string;

  @IsString()
  @MinLength(6)
  code!: string;
}
