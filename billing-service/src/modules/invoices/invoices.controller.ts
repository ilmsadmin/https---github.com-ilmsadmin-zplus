import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Query, 
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({ status: 201, description: 'The invoice has been successfully created.', type: Invoice })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async create(@Body(ValidationPipe) createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiQuery({ name: 'tenantId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: InvoiceStatus })
  @ApiQuery({ name: 'from', required: false, type: Date })
  @ApiQuery({ name: 'to', required: false, type: Date })
  @ApiResponse({ status: 200, description: 'Return all invoices.', type: [Invoice] })
  async findAll(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: InvoiceStatus,
    @Query('from') from?: Date,
    @Query('to') to?: Date,
  ): Promise<Invoice[]> {
    return this.invoicesService.findAll({ tenantId, status, from, to });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an invoice by id' })
  @ApiResponse({ status: 200, description: 'Return the invoice.', type: Invoice })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Invoice> {
    return this.invoicesService.findOne(id);
  }

  @Get('number/:number')
  @ApiOperation({ summary: 'Get an invoice by invoice number' })
  @ApiResponse({ status: 200, description: 'Return the invoice.', type: Invoice })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  async findByNumber(@Param('number') invoiceNumber: string): Promise<Invoice> {
    return this.invoicesService.findByNumber(invoiceNumber);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an invoice' })
  @ApiResponse({ status: 200, description: 'The invoice has been successfully updated.', type: Invoice })
  @ApiResponse({ status: 400, description: 'Cannot update invoice with current status.' })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<Invoice> {
    return this.invoicesService.update(id, updateInvoiceDto);
  }

  @Patch(':id/mark-paid')
  @ApiOperation({ summary: 'Mark an invoice as paid' })
  @ApiResponse({ status: 200, description: 'The invoice has been successfully marked as paid.', type: Invoice })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  async markAsPaid(@Param('id', ParseUUIDPipe) id: string): Promise<Invoice> {
    return this.invoicesService.markAsPaid(id);
  }

  @Patch(':id/mark-overdue')
  @ApiOperation({ summary: 'Mark an invoice as overdue' })
  @ApiResponse({ status: 200, description: 'The invoice has been successfully marked as overdue.', type: Invoice })
  @ApiResponse({ status: 400, description: 'Cannot mark invoice with current status as overdue.' })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  async markAsOverdue(@Param('id', ParseUUIDPipe) id: string): Promise<Invoice> {
    return this.invoicesService.markAsOverdue(id);
  }

  @Patch(':id/void')
  @ApiOperation({ summary: 'Void an invoice' })
  @ApiResponse({ status: 200, description: 'The invoice has been successfully voided.', type: Invoice })
  @ApiResponse({ status: 400, description: 'Cannot void a paid invoice.' })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  async voidInvoice(@Param('id', ParseUUIDPipe) id: string): Promise<Invoice> {
    return this.invoicesService.voidInvoice(id);
  }

  @Post('subscription/:id')
  @ApiOperation({ summary: 'Generate invoice for a subscription' })
  @ApiResponse({ status: 201, description: 'The invoice has been successfully generated.', type: Invoice })
  @ApiResponse({ status: 404, description: 'Subscription not found.' })
  async generateSubscriptionInvoice(@Param('id', ParseUUIDPipe) id: string): Promise<Invoice> {
    return this.invoicesService.generateSubscriptionInvoice(id);
  }

  @Get('overdue/all')
  @ApiOperation({ summary: 'Get all overdue invoices' })
  @ApiResponse({ status: 200, description: 'Return all overdue invoices.', type: [Invoice] })
  async findOverdueInvoices(): Promise<Invoice[]> {
    return this.invoicesService.findOverdueInvoices();
  }
}
