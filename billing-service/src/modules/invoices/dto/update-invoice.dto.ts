import { PartialType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsBoolean, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInvoiceDto } from './create-invoice.dto';

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
  @ApiProperty({ description: 'PDF URL', example: 'https://example.com/invoices/inv-2023-0001.pdf', required: false })
  @IsString()
  @IsOptional()
  pdfUrl?: string;

  @ApiProperty({ description: 'Reminder sent at', example: '2023-01-10T00:00:00.000Z', required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  reminderSentAt?: Date;

  @ApiProperty({ description: 'Payment due reminder sent', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  reminderSent?: boolean;
}
