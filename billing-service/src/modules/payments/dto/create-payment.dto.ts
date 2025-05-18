import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsUUID, 
  IsEnum, 
  IsOptional,
  IsDate,
  IsNumber,
  IsObject,
  Min,
  MaxLength
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStatus, PaymentMethod } from '../entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Invoice ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  invoiceId: string;

  @ApiProperty({ description: 'Amount', example: 29.99 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Currency', example: 'USD', required: false })
  @IsString()
  @MaxLength(3)
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Payment date', example: '2023-01-01T00:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  paymentDate: Date;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod, example: PaymentMethod.CREDIT_CARD, required: false })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiProperty({ description: 'External transaction ID', example: 'txn_1234567890', required: false })
  @IsString()
  @IsOptional()
  transactionId?: string;

  @ApiProperty({ description: 'Status', enum: PaymentStatus, example: PaymentStatus.PENDING, required: false })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiProperty({ description: 'Payment provider', example: 'stripe', required: false })
  @IsString()
  @IsOptional()
  paymentProvider?: string;

  @ApiProperty({ description: 'Payment metadata', example: { customer_reference: 'cust123' }, required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
