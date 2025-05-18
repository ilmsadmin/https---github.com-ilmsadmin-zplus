import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Req,
  Res,
  HttpStatus,
  StreamableFile,
  ParseUUIDPipe,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { createReadStream } from 'fs';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { FilesService } from './files.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { FileFilterDto } from './dto/file-filter.dto';
import { FileResponseDto } from './dto/file-response.dto';
import { FileStatus } from './entities/file.entity';

@ApiTags('files')
@Controller('files')
@Tenant()
export class FilesController {
  private readonly logger = new Logger(FilesController.name);

  constructor(private readonly filesService: FilesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        data: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            folderId: { type: 'string' },
            encrypt: { type: 'boolean' },
            tags: { type: 'array', items: { type: 'string' } },
            isPublic: { type: 'boolean' },
            metadata: { type: 'object' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully', type: FileResponseDto })
  async uploadFile(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body('data') createFileDto: CreateFileDto,
  ): Promise<FileResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    try {
      // Parse JSON string if needed
      let fileData = createFileDto;
      if (typeof fileData === 'string') {
        fileData = JSON.parse(fileData);
      }

      return this.filesService.createFile(req.tenantId, req.user?.sub, file, fileData);
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('bulk')
  @UseInterceptors(FilesInterceptor('files', 10)) // Limit to 10 files at a time
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        folderId: { type: 'string' },
        encrypt: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully', type: [FileResponseDto] })
  async uploadMultipleFiles(
    @Req() req: Request,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folderId') folderId?: string,
    @Body('encrypt') encrypt?: boolean,
  ): Promise<FileResponseDto[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    try {
      return this.filesService.createMultipleFiles(
        req.tenantId,
        req.user?.sub,
        files,
        { folderId, encrypt: encrypt === 'true' || encrypt === true },
      );
    } catch (error) {
      this.logger.error(`Error uploading multiple files: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'List files with filtering' })
  @ApiResponse({ status: 200, description: 'List of files', type: [FileResponseDto] })
  async listFiles(
    @Req() req: Request,
    @Query() filterDto: FileFilterDto,
  ): Promise<{ data: FileResponseDto[]; total: number; page: number; limit: number }> {
    try {
      return this.filesService.findAll(req.tenantId, filterDto);
    } catch (error) {
      this.logger.error(`Error listing files: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file details by ID' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'File details', type: FileResponseDto })
  async getFileById(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FileResponseDto> {
    try {
      const file = await this.filesService.findById(req.tenantId, id);
      
      if (!file) {
        throw new NotFoundException(`File with ID ${id} not found`);
      }
      
      return file;
    } catch (error) {
      this.logger.error(`Error getting file by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'File content' })
  async downloadFile(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    try {
      const downloadResult = await this.filesService.downloadFile(req.tenantId, id, req.user?.sub);
      
      // Set headers for file download
      res.set({
        'Content-Type': downloadResult.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(downloadResult.fileName)}"`,
        'Content-Length': downloadResult.size,
      });
      
      return new StreamableFile(downloadResult.stream);
    } catch (error) {
      this.logger.error(`Error downloading file: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Preview a file (inline)' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'File preview' })
  async previewFile(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    try {
      const downloadResult = await this.filesService.downloadFile(req.tenantId, id, req.user?.sub, true);
      
      // Set headers for inline preview
      res.set({
        'Content-Type': downloadResult.mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(downloadResult.fileName)}"`,
        'Content-Length': downloadResult.size,
      });
      
      return new StreamableFile(downloadResult.stream);
    } catch (error) {
      this.logger.error(`Error previewing file: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update file metadata' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiBody({ type: UpdateFileDto })
  @ApiResponse({ status: 200, description: 'File updated successfully', type: FileResponseDto })
  async updateFile(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFileDto: UpdateFileDto,
  ): Promise<FileResponseDto> {
    try {
      const updatedFile = await this.filesService.updateFile(req.tenantId, id, updateFileDto);
      
      if (!updatedFile) {
        throw new NotFoundException(`File with ID ${id} not found`);
      }
      
      return updatedFile;
    } catch (error) {
      this.logger.error(`Error updating file: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 204, description: 'File deleted successfully' })
  async deleteFile(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    try {
      await this.filesService.deleteFile(req.tenantId, id);
      return;
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a deleted file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'File restored successfully', type: FileResponseDto })
  async restoreFile(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FileResponseDto> {
    try {
      const restoredFile = await this.filesService.updateFileStatus(
        req.tenantId,
        id,
        FileStatus.ACTIVE,
      );
      
      if (!restoredFile) {
        throw new NotFoundException(`File with ID ${id} not found`);
      }
      
      return restoredFile;
    } catch (error) {
      this.logger.error(`Error restoring file: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get versions of a file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'List of file versions' })
  async getFileVersions(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<any[]> {
    try {
      return this.filesService.getFileVersions(req.tenantId, id);
    } catch (error) {
      this.logger.error(`Error getting file versions: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post(':id/versions')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a new version of a file' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        changeDescription: {
          type: 'string',
          description: 'Description of the changes in this version',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'New version uploaded successfully' })
  async uploadNewVersion(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('changeDescription') changeDescription?: string,
  ): Promise<FileResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    try {
      return this.filesService.createNewVersion(req.tenantId, id, req.user?.sub, file, changeDescription);
    } catch (error) {
      this.logger.error(`Error uploading new version: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post(':id/tags')
  @ApiOperation({ summary: 'Add tags to a file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to add to the file',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Tags added successfully' })
  async addTags(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('tags') tags: string[],
  ): Promise<FileResponseDto> {
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      throw new BadRequestException('At least one tag is required');
    }

    try {
      return this.filesService.addTags(req.tenantId, id, req.user?.sub, tags);
    } catch (error) {
      this.logger.error(`Error adding tags: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':id/tags/:tagName')
  @ApiOperation({ summary: 'Remove a tag from a file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiParam({ name: 'tagName', description: 'Tag name to remove' })
  @ApiResponse({ status: 200, description: 'Tag removed successfully' })
  async removeTag(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('tagName') tagName: string,
  ): Promise<FileResponseDto> {
    try {
      return this.filesService.removeTag(req.tenantId, id, tagName);
    } catch (error) {
      this.logger.error(`Error removing tag: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id/presigned-url')
  @ApiOperation({ summary: 'Get a pre-signed URL for a file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiQuery({ name: 'expiresIn', required: false, description: 'Expiration time in seconds (default: 3600)' })
  @ApiResponse({ status: 200, description: 'Pre-signed URL for file access' })
  async getPresignedUrl(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('expiresIn') expiresIn?: number,
  ): Promise<{ url: string; expiresAt: Date }> {
    try {
      return this.filesService.getPresignedUrl(req.tenantId, id, expiresIn || 3600);
    } catch (error) {
      this.logger.error(`Error generating presigned URL: ${error.message}`, error.stack);
      throw error;
    }
  }
}
