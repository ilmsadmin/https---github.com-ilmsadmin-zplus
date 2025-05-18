import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsEnum, 
  IsBoolean, 
  Min,
  MaxLength
} from 'class-validator';
import { BillingCycle } from '../entities/plan.entity';

export class CreatePlanDto {
  @ApiProperty({ description: 'Plan name', example: 'Professional' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Plan description', example: 'Professional plan with advanced features', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Plan price', example: 29.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Billing cycle', enum: BillingCycle, example: BillingCycle.MONTHLY })
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @ApiProperty({ description: 'Whether the plan is active', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Trial period in days', example: 14, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  trialPeriodDays?: number;
}
