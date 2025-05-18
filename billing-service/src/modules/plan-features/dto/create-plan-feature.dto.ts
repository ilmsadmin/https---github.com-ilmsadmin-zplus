import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsUUID, 
  IsBoolean, 
  IsOptional,
  MaxLength
} from 'class-validator';

export class CreatePlanFeatureDto {
  @ApiProperty({ description: 'Plan ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  planId: string;

  @ApiProperty({ description: 'Feature name', example: 'max_users' })
  @IsString()
  @MaxLength(100)
  featureName: string;

  @ApiProperty({ description: 'Feature value', example: '50' })
  @IsString()
  @MaxLength(255)
  featureValue: string;

  @ApiProperty({ description: 'Whether the feature is enabled', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiProperty({ description: 'Feature description', example: 'Maximum number of users allowed', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
