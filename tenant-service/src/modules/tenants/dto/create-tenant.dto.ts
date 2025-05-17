import { 
  IsString, 
  IsUUID, 
  IsEmail, 
  IsOptional, 
  IsObject, 
  IsEnum, 
  IsDateString,
  MinLength,
  MaxLength,
  Matches 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
}

export class CreateTenantDto {
  @ApiProperty({
    description: 'The tenant name',
    example: 'Acme Corporation',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'The schema name used for subdomain and database schema',
    example: 'acme',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Schema name must contain only lowercase letters, numbers, and hyphens',
  })
  schemaName: string;

  @ApiProperty({
    description: 'The package ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  packageId: string;

  @ApiProperty({
    description: 'The tenant status',
    enum: TenantStatus,
    default: TenantStatus.ACTIVE,
    example: TenantStatus.ACTIVE,
  })
  @IsEnum(TenantStatus)
  @IsOptional()
  status?: TenantStatus;

  @ApiProperty({
    description: 'The billing email',
    example: 'billing@acme.com',
  })
  @IsEmail()
  @IsOptional()
  billingEmail?: string;

  @ApiProperty({
    description: 'The billing address',
    example: '123 Main St, New York, NY 10001',
  })
  @IsString()
  @IsOptional()
  billingAddress?: string;

  @ApiProperty({
    description: 'The billing information as JSON',
    example: { taxId: '123456789', billingContact: 'John Doe' },
  })
  @IsObject()
  @IsOptional()
  billingInfo?: Record<string, any>;

  @ApiProperty({
    description: 'The subscription start date',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  subscriptionStartDate?: string;

  @ApiProperty({
    description: 'The subscription end date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  subscriptionEndDate?: string;

  @ApiProperty({
    description: 'The initial modules to enable for this tenant',
    example: ['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003'],
  })
  @IsUUID('4', { each: true })
  @IsOptional()
  modules?: string[];
}
