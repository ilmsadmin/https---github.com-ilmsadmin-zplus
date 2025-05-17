import { 
  IsString, 
  IsInt, 
  IsNumber, 
  IsEnum, 
  IsObject, 
  IsOptional, 
  Min, 
  MaxLength 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export class CreatePackageDto {
  @ApiProperty({
    description: 'The package name',
    example: 'Basic',
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'The package description',
    example: 'Basic package for small teams',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'The maximum number of users allowed',
    example: 10,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  maxUsers: number;

  @ApiProperty({
    description: 'The maximum storage allowed in bytes',
    example: 1000000000, // 1GB
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  maxStorage: number;

  @ApiProperty({
    description: 'The package price',
    example: 99.99,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'The billing cycle',
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
    example: BillingCycle.MONTHLY,
  })
  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @ApiProperty({
    description: 'The features included in the package',
    example: { modules: ['crm'], white_labeling: false },
  })
  @IsObject()
  @IsOptional()
  features?: Record<string, any>;

  @ApiProperty({
    description: 'The API rate limit',
    example: 1000,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  apiRateLimit?: number;
}
