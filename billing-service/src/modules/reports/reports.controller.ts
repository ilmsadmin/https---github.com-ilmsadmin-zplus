import {
  Controller,
  Get,
  Query,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService, RevenueReport, SubscriptionReport, InvoiceReport, PeriodFilter } from './reports.service';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';

class GetReportQueryDto {
  @IsDateString()
  @ApiQuery({ name: 'startDate', required: true, type: String, example: '2023-01-01' })
  startDate: string;

  @IsDateString()
  @ApiQuery({ name: 'endDate', required: true, type: String, example: '2023-12-31' })
  endDate: string;

  @IsOptional()
  @IsUUID()
  @ApiQuery({ name: 'tenantId', required: false, type: String })
  tenantId?: string;
}

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue report' })
  @ApiResponse({ status: 200, description: 'Return revenue report.' })
  async getRevenueReport(
    @Query(ValidationPipe) query: GetReportQueryDto,
  ): Promise<RevenueReport> {
    const filter: PeriodFilter = {
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
    };
    
    return this.reportsService.getRevenueReport(filter, query.tenantId);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Get subscription report' })
  @ApiQuery({ name: 'tenantId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return subscription report.' })
  async getSubscriptionReport(
    @Query('tenantId') tenantId?: string,
  ): Promise<SubscriptionReport> {
    return this.reportsService.getSubscriptionReport(tenantId);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get invoice report' })
  @ApiResponse({ status: 200, description: 'Return invoice report.' })
  async getInvoiceReport(
    @Query(ValidationPipe) query: GetReportQueryDto,
  ): Promise<InvoiceReport> {
    const filter: PeriodFilter = {
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
    };
    
    return this.reportsService.getInvoiceReport(filter, query.tenantId);
  }

  @Get('mrr')
  @ApiOperation({ summary: 'Get Monthly Recurring Revenue' })
  @ApiQuery({ name: 'date', required: false, type: String, example: '2023-10-01' })
  @ApiResponse({ status: 200, description: 'Return MRR value.' })
  async getMRR(
    @Query('date') dateString?: string,
  ): Promise<{ mrr: number }> {
    const date = dateString ? new Date(dateString) : undefined;
    const mrr = await this.reportsService.getMRR(date);
    
    return { mrr };
  }
}
