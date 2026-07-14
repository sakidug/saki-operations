import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { AUTH_PASSWORD_MIN_LENGTH } from '@saki-operations/constants';

export class LoginDto {
  @IsString()
  identifier!: string;

  @IsString()
  @MinLength(1)
  password!: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class RefreshDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class ForgotPasswordDto {
  @IsString()
  identifier!: string;
}

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(AUTH_PASSWORD_MIN_LENGTH)
  password!: string;

  @IsString()
  @MinLength(AUTH_PASSWORD_MIN_LENGTH)
  confirmPassword!: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(AUTH_PASSWORD_MIN_LENGTH)
  newPassword!: string;

  @IsString()
  @MinLength(AUTH_PASSWORD_MIN_LENGTH)
  confirmPassword!: string;
}
