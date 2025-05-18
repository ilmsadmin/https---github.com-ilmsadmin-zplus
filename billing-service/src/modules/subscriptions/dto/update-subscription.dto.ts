import { PartialType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSubscriptionDto } from './create-subscription.dto';

export class UpdateSubscriptionDto extends PartialType(CreateSubscriptionDto) {
  @ApiProperty({ description: 'Cancellation date', example: '2023-06-15T00:00:00.000Z', required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  canceledAt?: Date;

  @ApiProperty({ description: 'Cancellation reason', example: 'Switching to a different service', required: false })
  @IsString()
  @IsOptional()
  cancelReason?: string;
}
