import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ status: 201, description: 'The subscription has been successfully created.', type: Subscription })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async create(@Body(ValidationPipe) createSubscriptionDto: CreateSubscriptionDto): Promise<Subscription> {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions' })
  @ApiQuery({ name: 'tenantId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: SubscriptionStatus })
  @ApiResponse({ status: 200, description: 'Return all subscriptions.', type: [Subscription] })
  async findAll(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: SubscriptionStatus,
  ): Promise<Subscription[]> {
    return this.subscriptionsService.findAll({ tenantId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subscription by id' })
  @ApiResponse({ status: 200, description: 'Return the subscription.', type: Subscription })
  @ApiResponse({ status: 404, description: 'Subscription not found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Subscription> {
    return this.subscriptionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a subscription' })
  @ApiResponse({ status: 200, description: 'The subscription has been successfully updated.', type: Subscription })
  @ApiResponse({ status: 404, description: 'Subscription not found.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<Subscription> {
    return this.subscriptionsService.update(id, updateSubscriptionDto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiQuery({ name: 'atPeriodEnd', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'The subscription has been successfully canceled.', type: Subscription })
  @ApiResponse({ status: 400, description: 'Subscription already canceled.' })
  @ApiResponse({ status: 404, description: 'Subscription not found.' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('atPeriodEnd') atPeriodEnd?: boolean,
  ): Promise<Subscription> {
    return this.subscriptionsService.cancel(id, atPeriodEnd);
  }

  @Patch(':id/renew')
  @ApiOperation({ summary: 'Renew a subscription' })
  @ApiResponse({ status: 200, description: 'The subscription has been successfully renewed.', type: Subscription })
  @ApiResponse({ status: 400, description: 'Subscription cannot be renewed.' })
  @ApiResponse({ status: 404, description: 'Subscription not found.' })
  async renew(@Param('id', ParseUUIDPipe) id: string): Promise<Subscription> {
    return this.subscriptionsService.renewSubscription(id);
  }

  @Get('expiring/:days')
  @ApiOperation({ summary: 'Get subscriptions expiring in the next X days' })
  @ApiResponse({ status: 200, description: 'Return expiring subscriptions.', type: [Subscription] })
  async getExpiringSubscriptions(@Param('days') days: number): Promise<Subscription[]> {
    return this.subscriptionsService.findExpiringSubscriptions(days);
  }
}
