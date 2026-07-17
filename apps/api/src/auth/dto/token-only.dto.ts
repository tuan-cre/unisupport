import { IsString } from 'class-validator';

export class TokenOnlyDto {
  @IsString()
  token!: string;
}
