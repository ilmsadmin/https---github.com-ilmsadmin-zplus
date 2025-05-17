import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MfaMethodEnum {
  TOTP = 'totp',
  SMS = 'sms',
  EMAIL = 'email',
}

export class MfaSetupDto {
  @ApiProperty({ description: 'MFA method', example: MfaMethodEnum.TOTP, enum: MfaMethodEnum })
  @IsEnum(MfaMethodEnum)
  @IsNotEmpty()
  method: MfaMethodEnum;

  @ApiPropertyOptional({ description: 'Phone number (for SMS method)', example: '+1234567890' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}

export class MfaVerifyDto {
  @ApiProperty({ description: 'MFA code from authenticator app, SMS, or email', example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'MFA method', example: MfaMethodEnum.TOTP, enum: MfaMethodEnum })
  @IsEnum(MfaMethodEnum)
  @IsOptional()
  method?: MfaMethodEnum;

  @ApiPropertyOptional({ description: 'MFA session ID (required for login flow)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsOptional()
  sessionId?: string;
}

export class MfaDisableDto {
  @ApiProperty({ description: 'Current password to confirm MFA disable', example: 'P@ssw0rd123' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;
}

export class MfaRecoveryCodeDto {
  @ApiProperty({ description: 'Recovery code', example: 'ABCD-EFGH-1234-5678' })
  @IsString()
  @IsNotEmpty()
  recoveryCode: string;

  @ApiProperty({ description: 'MFA session ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}
