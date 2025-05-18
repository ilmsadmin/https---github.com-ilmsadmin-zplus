import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  HttpStatus,
  ParseUUIDPipe,
  BadRequestException,
  NotFoundException,
  Logger,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { SkipAuth } from '../../common/decorators/skip-auth.decorator';
import { SharingService } from './sharing.service';
import { FilesService } from '../files/files.service';
import { CreateShareDto } from './dto/create-share.dto';
import { UpdateShareDto } from './dto/update-share.dto';
import { ShareFilterDto } from './dto/share-filter.dto';
import { ShareResponseDto } from './dto/share-response.dto';

@ApiTags('sharing')
@Controller('shares')
@Tenant()
export class SharingController {
  private readonly logger = new Logger(SharingController.name);

  constructor(
    private readonly sharingService: SharingService,
    private readonly filesService: FilesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new file share' })
  @ApiResponse({ status: 201, description: 'Share created successfully', type: ShareResponseDto })
  async createShare(
    @Req() req: Request,
    @Body() createShareDto: CreateShareDto,
  ): Promise<ShareResponseDto> {
    try {
      return await this.sharingService.createShare(
        req.tenantId,
        req.user?.sub,
        createShareDto,
      );
    } catch (error) {
      this.logger.error(`Error creating share: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'List shares with filtering' })
  @ApiResponse({ status: 200, description: 'List of shares', type: [ShareResponseDto] })
  async listShares(
    @Req() req: Request,
    @Query() filterDto: ShareFilterDto,
  ): Promise<{ data: ShareResponseDto[]; total: number; page: number; limit: number }> {
    try {
      return await this.sharingService.findAll(req.tenantId, filterDto);
    } catch (error) {
      this.logger.error(`Error listing shares: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get share details by ID' })
  @ApiParam({ name: 'id', description: 'Share ID' })
  @ApiResponse({ status: 200, description: 'Share details', type: ShareResponseDto })
  async getShareById(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ShareResponseDto> {
    try {
      return await this.sharingService.findById(req.tenantId, id);
    } catch (error) {
      this.logger.error(`Error getting share by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a share' })
  @ApiParam({ name: 'id', description: 'Share ID' })
  @ApiResponse({ status: 200, description: 'Share updated successfully', type: ShareResponseDto })
  async updateShare(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateShareDto: UpdateShareDto,
  ): Promise<ShareResponseDto> {
    try {
      return await this.sharingService.updateShare(req.tenantId, id, updateShareDto);
    } catch (error) {
      this.logger.error(`Error updating share: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a share' })
  @ApiParam({ name: 'id', description: 'Share ID' })
  @ApiResponse({ status: 200, description: 'Share deleted successfully' })
  async deleteShare(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean }> {
    try {
      const success = await this.sharingService.deleteShare(req.tenantId, id);
      return { success };
    } catch (error) {
      this.logger.error(`Error deleting share: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('public/:accessKey')
  @SkipAuth()
  @ApiOperation({ summary: 'Access a public share by access key' })
  @ApiParam({ name: 'accessKey', description: 'Share access key' })
  @ApiQuery({ name: 'password', required: false, description: 'Password for protected shares' })
  @ApiResponse({ status: 200, description: 'Share details', type: ShareResponseDto })
  async getPublicShare(
    @Param('accessKey') accessKey: string,
    @Query('password') password?: string,
  ): Promise<ShareResponseDto> {
    try {
      // Validate share access
      const share = await this.sharingService.validateShareAccess(
        null,
        accessKey,
        password,
      );
      
      // Increment view count
      await this.sharingService.incrementViewCount(share.id);
      
      return share;
    } catch (error) {
      this.logger.error(`Error accessing public share: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('public/:accessKey/download')
  @SkipAuth()
  @ApiOperation({ summary: 'Download a file from a public share' })
  @ApiParam({ name: 'accessKey', description: 'Share access key' })
  @ApiQuery({ name: 'password', required: false, description: 'Password for protected shares' })
  @ApiResponse({ status: 200, description: 'File content' })
  async downloadPublicShare(
    @Param('accessKey') accessKey: string,
    @Query('password') password: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    try {
      // Validate share access
      const share = await this.sharingService.validateShareAccess(
        null,
        accessKey,
        password,
      );
      
      // Check if download permission is granted
      if (![SharePermission.DOWNLOAD, SharePermission.ADMIN].includes(share.permission)) {
        throw new BadRequestException('This share does not have download permission');
      }
      
      // Increment download count
      await this.sharingService.incrementDownloadCount(share.id);
      
      // Get the file
      const downloadResult = await this.filesService.downloadFile(share.tenantId, share.fileId);
      
      // Set headers for file download
      res.set({
        'Content-Type': downloadResult.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(downloadResult.fileName)}"`,
        'Content-Length': downloadResult.size,
      });
      
      return new StreamableFile(downloadResult.stream);
    } catch (error) {
      this.logger.error(`Error downloading public share: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('public/:accessKey/preview')
  @SkipAuth()
  @ApiOperation({ summary: 'Preview a file from a public share' })
  @ApiParam({ name: 'accessKey', description: 'Share access key' })
  @ApiQuery({ name: 'password', required: false, description: 'Password for protected shares' })
  @ApiResponse({ status: 200, description: 'File content for preview' })
  async previewPublicShare(
    @Param('accessKey') accessKey: string,
    @Query('password') password: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    try {
      // Validate share access
      const share = await this.sharingService.validateShareAccess(
        null,
        accessKey,
        password,
      );
      
      // Increment view count
      await this.sharingService.incrementViewCount(share.id);
      
      // Get the file
      const downloadResult = await this.filesService.downloadFile(share.tenantId, share.fileId);
      
      // Set headers for file preview
      res.set({
        'Content-Type': downloadResult.mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(downloadResult.fileName)}"`,
        'Content-Length': downloadResult.size,
      });
      
      return new StreamableFile(downloadResult.stream);
    } catch (error) {
      this.logger.error(`Error previewing public share: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Validate access to a share with password if needed' })
  @ApiParam({ name: 'id', description: 'Share ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        password: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Access validated', type: ShareResponseDto })
  async validateShareAccess(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('password') password?: string,
  ): Promise<ShareResponseDto> {
    try {
      return await this.sharingService.validateShareAccess(id, null, password);
    } catch (error) {
      this.logger.error(`Error validating share access: ${error.message}`, error.stack);
      throw error;
    }
  }
}
