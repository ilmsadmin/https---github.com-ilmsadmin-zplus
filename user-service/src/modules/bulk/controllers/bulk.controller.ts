import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';

import { BulkService } from '../services/bulk.service';
import { BulkImportUsersDto, BulkExportUsersDto, BulkDeleteUsersDto } from '../dto/bulk.dto';
import { TenantContext } from '../../../common/decorators/tenant-context.decorator';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';

@ApiTags('bulk')
@ApiBearerAuth()
@Controller('bulk')
export class BulkController {
  constructor(private readonly bulkService: BulkService) {}

  @Post('import/users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk import users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users imported successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'number' },
        failed: { type: 'number' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              index: { type: 'number' },
              email: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async importUsers(
    @Body() bulkImportUsersDto: BulkImportUsersDto,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<{
    success: number;
    failed: number;
    errors: { index: number; email: string; error: string }[];
  }> {
    return this.bulkService.importUsers(bulkImportUsersDto, tenantContext);
  }

  @Post('export/users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk export users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users exported successfully.',
  })
  async exportUsers(
    @Body() bulkExportUsersDto: BulkExportUsersDto,
    @TenantContext() tenantContext: ITenantContext,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.bulkService.exportUsers(bulkExportUsersDto, tenantContext);
    
    if (result.format === 'csv') {
      // For CSV, set appropriate headers and send as a downloadable file
      response.setHeader('Content-Type', 'text/csv');
      response.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
      response.send(result.data);
    } else {
      // For JSON, just send the data
      response.json({
        data: result.data,
        count: result.count,
        format: result.format,
      });
    }
  }

  @Post('delete/users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk delete users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users deleted successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'number' },
        failed: { type: 'number' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or no user IDs provided.',
  })
  async deleteUsers(
    @Body() bulkDeleteUsersDto: BulkDeleteUsersDto,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<{
    success: number;
    failed: number;
    errors: { userId: string; error: string }[];
  }> {
    return this.bulkService.deleteUsers(bulkDeleteUsersDto, tenantContext);
  }
}
