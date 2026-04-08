import { IsString, IsNotEmpty, IsUUID, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
