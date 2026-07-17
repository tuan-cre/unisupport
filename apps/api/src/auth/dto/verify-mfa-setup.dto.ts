import { IsString, MinLength } from 'class-validator';

export class VerifyMfaSetupDto {
  @IsString()
  @MinLength(6)
  code!: string;
}
