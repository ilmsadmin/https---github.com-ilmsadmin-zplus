import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({ description: 'Access token (JWT)', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty({ description: 'Access token expiration in seconds', example: 900 })
  expiresIn: number;

  @ApiPropertyOptional({ description: 'User needs to complete MFA', example: true })
  requireMfa?: boolean;

  @ApiPropertyOptional({ description: 'MFA session ID for verification', example: '550e8400-e29b-41d4-a716-446655440000' })
  mfaSessionId?: string;

  @ApiProperty({ description: 'User information' })
  user: UserResponseDto;
}

export class MfaRequiredResponseDto {
  @ApiProperty({ description: 'MFA required flag', example: true })
  requireMfa: boolean;

  @ApiProperty({ description: 'MFA session ID for verification', example: '550e8400-e29b-41d4-a716-446655440000' })
  mfaSessionId: string;

  @ApiProperty({ description: 'MFA methods available', example: ['totp', 'sms'] })
  mfaMethods: string[];
}

export class UserResponseDto {
  @ApiProperty({ description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Username', example: 'johndoe' })
  username: string;

  @ApiProperty({ description: 'Email address', example: 'john.doe@example.com' })
  email: string;

  @ApiPropertyOptional({ description: 'First name', example: 'John' })
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Doe' })
  lastName?: string;

  @ApiProperty({ description: 'User role', example: 'admin' })
  role: string;

  @ApiPropertyOptional({ description: 'User permissions', example: ['read:users', 'write:users'] })
  permissions?: string[];

  @ApiProperty({ description: 'MFA enabled flag', example: true })
  isMfaEnabled: boolean;

  @ApiPropertyOptional({ description: 'Tenant ID (for tenant users)', example: '550e8400-e29b-41d4-a716-446655440010' })
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Tenant schema name (for tenant users)', example: 'tenant1' })
  tenantSchemaName?: string;
}

export class TokenRefreshResponseDto {
  @ApiProperty({ description: 'New access token (JWT)', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ description: 'New refresh token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty({ description: 'Access token expiration in seconds', example: 900 })
  expiresIn: number;
}

export class MessageResponseDto {
  @ApiProperty({ description: 'Status message', example: 'Password reset email sent' })
  message: string;
}
