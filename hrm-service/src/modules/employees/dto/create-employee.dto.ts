import { IsString, IsEmail, IsUUID, IsOptional, IsDate, IsNumber, IsObject, Length, Min, Max, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateEmployeeDto {
  @ApiProperty({
    description: 'Employee first name',
    example: 'John',
  })
  @IsString()
  @Length(1, 100)
  firstName: string;

  @ApiProperty({
    description: 'Employee last name',
    example: 'Doe',
  })
  @IsString()
  @Length(1, 100)
  lastName: string;

  @ApiProperty({
    description: 'Employee email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Employee phone number',
    example: '+1234567890',
  })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Employee date of birth',
    example: '1990-01-01',
  })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Employee date of joining',
    example: '2022-01-01',
  })
  @IsDateString()
  dateOfJoining: string;

  @ApiPropertyOptional({
    description: 'Employee date of termination',
    example: '2023-01-01',
  })
  @IsDateString()
  @IsOptional()
  dateOfTermination?: string;

  @ApiPropertyOptional({
    description: 'Employee address',
    example: '123 Main St',
  })
  @IsString()
  @IsOptional()
  @Length(0, 255)
  address?: string;

  @ApiPropertyOptional({
    description: 'Employee city',
    example: 'New York',
  })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  city?: string;

  @ApiPropertyOptional({
    description: 'Employee state',
    example: 'NY',
  })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  state?: string;

  @ApiPropertyOptional({
    description: 'Employee postal code',
    example: '10001',
  })
  @IsString()
  @IsOptional()
  @Length(0, 20)
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Employee country',
    example: 'USA',
  })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  country?: string;

  @ApiPropertyOptional({
    description: 'Department ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'Position ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsOptional()
  positionId?: string;

  @ApiPropertyOptional({
    description: 'Employee number',
    example: 'EMP001',
  })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  employeeNumber?: string;

  @ApiPropertyOptional({
    description: 'Employee salary',
    example: 50000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1000000000)
  salary?: number;

  @ApiPropertyOptional({
    description: 'Employee status',
    example: 'active',
    default: 'active',
  })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  status?: string;

  @ApiPropertyOptional({
    description: 'Additional employee information',
    example: { emergencyContact: '+1987654321' },
  })
  @IsObject()
  @IsOptional()
  additionalInfo?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Manager ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  @IsOptional()
  managerId?: string;
}
