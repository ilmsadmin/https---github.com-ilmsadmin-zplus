import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsUUID, 
  IsEnum, 
  IsOptional,
  IsDate,
  IsObject,
  ValidateIf
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubscriptionStatus, RenewalType } from '../entities/subscription.entity';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Tenant ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ description: 'Plan ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  planId: string;

  @ApiProperty({ description: 'Start date', example: '2023-01-01T00:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ description: 'End date', example: '2024-01-01T00:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({ description: 'Status', enum: SubscriptionStatus, example: SubscriptionStatus.ACTIVE, required: false })
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @ApiProperty({ description: 'Renewal type', enum: RenewalType, example: RenewalType.AUTO, required: false })
  @IsEnum(RenewalType)
  @IsOptional()
  renewalType?: RenewalType;

  @ApiProperty({ description: 'Trial end date', example: '2023-01-15T00:00:00.000Z', required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  trialEndDate?: Date;

  @ApiProperty({ description: 'External subscription ID (e.g., Stripe)', example: 'sub_1234567890', required: false })
  @IsString()
  @IsOptional()
  externalId?: string;

  @ApiProperty({ description: 'Custom metadata', example: { referral: 'partner123' }, required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
