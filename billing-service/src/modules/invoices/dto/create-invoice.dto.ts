import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsUUID, 
  IsEnum, 
  IsOptional,
  IsDate,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  MaxLength,
  IsEmail
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus } from '../entities/invoice.entity';

class InvoiceItemDto {
  @ApiProperty({ description: 'Description', example: 'Monthly subscription - Professional Plan' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Quantity', example: 1 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Unit price', example: 29.99 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ description: 'Total amount', example: 29.99 })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Subscription ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  subscriptionId: string;

  @ApiProperty({ description: 'Invoice number', example: 'INV-2023-0001' })
  @IsString()
  @MaxLength(50)
  invoiceNumber: string;

  @ApiProperty({ description: 'Total amount', example: 29.99 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Currency', example: 'USD', required: false })
  @IsString()
  @MaxLength(3)
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Issue date', example: '2023-01-01T00:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  issueDate: Date;

  @ApiProperty({ description: 'Due date', example: '2023-01-15T00:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @ApiProperty({ description: 'Status', enum: InvoiceStatus, example: InvoiceStatus.PENDING, required: false })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @ApiProperty({ type: [InvoiceItemDto], description: 'Invoice items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @ApiProperty({ description: 'Subtotal', example: 29.99 })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({ description: 'Tax amount', example: 2.99, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  tax?: number;

  @ApiProperty({ description: 'Tax rate', example: 10, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxRate?: number;

  @ApiProperty({ description: 'Discount amount', example: 5, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiProperty({ description: 'Invoice notes', example: 'Thank you for your business!', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Customer email for invoice', example: 'customer@example.com', required: false })
  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @ApiProperty({ description: 'Customer billing address', example: '123 Main St, City, Country', required: false })
  @IsString()
  @IsOptional()
  billingAddress?: string;
}
