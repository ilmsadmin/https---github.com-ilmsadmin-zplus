import { IsEmail, IsNotEmpty, IsString, MinLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'User password', example: 'P@ssw0rd123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ description: 'Tenant schema name (for tenant users)', example: 'tenant1' })
  @IsString()
  @IsOptional()
  tenant: string;
}

export class SystemLoginDto {
  @ApiProperty({ description: 'System user email', example: 'admin@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'System user password', example: 'P@ssw0rd123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterUserDto {
  @ApiProperty({ description: 'Username', example: 'johndoe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @ApiProperty({ description: 'Email address', example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'First name', example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ 
    description: 'Password (minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character)', 
    example: 'P@ssw0rd123' 
  })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
    },
  )
  password: string;

  @ApiProperty({ description: 'Tenant schema name', example: 'tenant1' })
  @IsString()
  @IsNotEmpty()
  tenant: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+1234567890' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Role ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsOptional()
  roleId?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ description: 'Email address', example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: 'Tenant schema name (for tenant users)', example: 'tenant1' })
  @IsString()
  @IsOptional()
  tenant?: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Reset password token', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ 
    description: 'New password (minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character)', 
    example: 'NewP@ssw0rd123' 
  })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
    },
  )
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password', example: 'OldP@ssw0rd123' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ 
    description: 'New password (minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character)', 
    example: 'NewP@ssw0rd123' 
  })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
    },
  )
  newPassword: string;
}
