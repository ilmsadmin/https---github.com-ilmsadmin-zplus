import { PartialType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePaymentDto } from './create-payment.dto';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
  @ApiProperty({ description: 'Refund amount', example: 15.99, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  refundAmount?: number;

  @ApiProperty({ description: 'Refund date', example: '2023-01-15T00:00:00.000Z', required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  refundDate?: Date;

  @ApiProperty({ description: 'Refund reason', example: 'Customer requested partial refund', required: false })
  @IsString()
  @IsOptional()
  refundReason?: string;

  @ApiProperty({ description: 'Error message', example: 'Payment processing failed: insufficient funds', required: false })
  @IsString()
  @IsOptional()
  errorMessage?: string;
}
