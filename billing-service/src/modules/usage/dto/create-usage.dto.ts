import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsUUID, 
  IsOptional,
  IsDate,
  IsNumber,
  IsObject,
  IsBoolean,
  Min,
  MaxLength
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUsageDto {
  @ApiProperty({ description: 'Tenant ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ description: 'Resource type', example: 'api_calls' })
  @IsString()
  @MaxLength(50)
  resourceType: string;

  @ApiProperty({ description: 'Quantity used', example: 150 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Usage date', example: '2023-01-01T00:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  recordedDate: Date;

  @ApiProperty({ description: 'Unit of measurement', example: 'count', required: false })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  unit?: string;

  @ApiProperty({ description: 'Source of the usage data', example: 'api-gateway', required: false })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({ description: 'User ID who triggered the usage', example: '550e8400-e29b-41d4-a716-446655440001', required: false })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({ description: 'Description', example: 'API calls to /users endpoint', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Associated subscription ID', example: '550e8400-e29b-41d4-a716-446655440002', required: false })
  @IsUUID()
  @IsOptional()
  subscriptionId?: string;

  @ApiProperty({ description: 'Metadata', example: { ip_address: '192.168.1.1' }, required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
