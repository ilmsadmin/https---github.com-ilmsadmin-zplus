import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum, IsBoolean, IsObject, IsArray, IsUUID } from 'class-validator';
import { UserStatus } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'First name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ description: 'Password' })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'User status', required: false, enum: UserStatus })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiProperty({ description: 'Job title', required: false })
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @ApiProperty({ description: 'Department', required: false })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ description: 'Phone number', required: false })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ description: 'Profile picture URL', required: false })
  @IsString()
  @IsOptional()
  profilePictureUrl?: string;

  @ApiProperty({ description: 'Preferred language', required: false })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ description: 'Preferred theme', required: false })
  @IsString()
  @IsOptional()
  theme?: string;

  @ApiProperty({ description: 'User metadata', required: false, type: 'object' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'User preferences', required: false, type: 'object' })
  @IsObject()
  @IsOptional()
  preferences?: Record<string, any>;

  @ApiProperty({ description: 'Role IDs to assign', required: false, type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  roleIds?: string[];

  @ApiProperty({ description: 'Team IDs to assign', required: false, type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  teamIds?: string[];
}
