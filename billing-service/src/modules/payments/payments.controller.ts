import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Query, 
  ParseUUIDPipe,
  ValidationPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment, PaymentStatus } from './entities/payment.entity';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, description: 'The payment has been successfully created.', type: Payment })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async create(@Body(ValidationPipe) createPaymentDto: CreatePaymentDto): Promise<Payment> {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  @ApiQuery({ name: 'tenantId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  @ApiResponse({ status: 200, description: 'Return all payments.', type: [Payment] })
  async findAll(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: PaymentStatus,
  ): Promise<Payment[]> {
    return this.paymentsService.findAll({ tenantId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a payment by id' })
  @ApiResponse({ status: 200, description: 'Return the payment.', type: Payment })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Payment> {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a payment' })
  @ApiResponse({ status: 200, description: 'The payment has been successfully updated.', type: Payment })
  @ApiResponse({ status: 400, description: 'Cannot update payment with current status.' })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update payment status' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(PaymentStatus),
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'The payment status has been successfully updated.', type: Payment })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: PaymentStatus,
  ): Promise<Payment> {
    return this.paymentsService.updateStatus(id, status);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund a payment' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Refund amount. If not provided, full amount will be refunded.',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'The payment has been successfully refunded.', type: Payment })
  @ApiResponse({ status: 400, description: 'Cannot refund payment with current status.' })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  async refund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('amount') amount?: number,
  ): Promise<Payment> {
    return this.paymentsService.refund(id, amount);
  }
}
