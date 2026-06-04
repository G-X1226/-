import { IsEmail, IsOptional, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;
}
