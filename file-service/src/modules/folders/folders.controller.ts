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
  HttpStatus,
  ParseUUIDPipe,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { MoveFolderDto } from './dto/move-folder.dto';
import { FolderFilterDto } from './dto/folder-filter.dto';
import { FolderResponseDto } from './dto/folder-response.dto';

@ApiTags('folders')
@Controller('folders')
@Tenant()
export class FoldersController {
  private readonly logger = new Logger(FoldersController.name);

  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new folder' })
  @ApiResponse({ status: 201, description: 'Folder created successfully', type: FolderResponseDto })
  async createFolder(
    @Req() req: Request,
    @Body() createFolderDto: CreateFolderDto,
  ): Promise<FolderResponseDto> {
    try {
      return await this.foldersService.createFolder(
        req.tenantId,
        req.user?.sub,
        createFolderDto,
      );
    } catch (error) {
      this.logger.error(`Error creating folder: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'List folders with filtering' })
  @ApiResponse({ status: 200, description: 'List of folders', type: [FolderResponseDto] })
  async listFolders(
    @Req() req: Request,
    @Query() filterDto: FolderFilterDto,
  ): Promise<{ data: FolderResponseDto[]; total: number; page: number; limit: number }> {
    try {
      return await this.foldersService.findAll(req.tenantId, filterDto);
    } catch (error) {
      this.logger.error(`Error listing folders: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get folder details by ID' })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  @ApiResponse({ status: 200, description: 'Folder details', type: FolderResponseDto })
  async getFolderById(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FolderResponseDto> {
    try {
      const folder = await this.foldersService.findById(req.tenantId, id);
      
      if (!folder) {
        throw new NotFoundException(`Folder with ID ${id} not found`);
      }
      
      return folder;
    } catch (error) {
      this.logger.error(`Error getting folder by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a folder' })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  @ApiResponse({ status: 200, description: 'Folder updated successfully', type: FolderResponseDto })
  async updateFolder(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFolderDto: UpdateFolderDto,
  ): Promise<FolderResponseDto> {
    try {
      return await this.foldersService.updateFolder(req.tenantId, id, updateFolderDto);
    } catch (error) {
      this.logger.error(`Error updating folder: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':id/move')
  @ApiOperation({ summary: 'Move a folder to a new parent' })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  @ApiResponse({ status: 200, description: 'Folder moved successfully', type: FolderResponseDto })
  async moveFolder(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() moveFolderDto: MoveFolderDto,
  ): Promise<FolderResponseDto> {
    try {
      return await this.foldersService.moveFolder(req.tenantId, id, moveFolderDto.newParentId);
    } catch (error) {
      this.logger.error(`Error moving folder: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a folder (soft delete)' })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  @ApiResponse({ status: 200, description: 'Folder deleted successfully' })
  async deleteFolder(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean }> {
    try {
      const success = await this.foldersService.deleteFolder(req.tenantId, id);
      return { success };
    } catch (error) {
      this.logger.error(`Error deleting folder: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete a folder' })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  @ApiResponse({ status: 200, description: 'Folder permanently deleted' })
  async permanentlyDeleteFolder(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean }> {
    try {
      const success = await this.foldersService.permanentlyDeleteFolder(req.tenantId, id);
      return { success };
    } catch (error) {
      this.logger.error(`Error permanently deleting folder: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'Get a folder\'s children' })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  @ApiResponse({ status: 200, description: 'List of child folders', type: [FolderResponseDto] })
  async getFolderChildren(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FolderResponseDto[]> {
    try {
      return await this.foldersService.getChildren(req.tenantId, id);
    } catch (error) {
      this.logger.error(`Error getting folder children: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id/ancestry')
  @ApiOperation({ summary: 'Get folder ancestry (from root to this folder)' })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  @ApiResponse({ status: 200, description: 'List of ancestor folders', type: [FolderResponseDto] })
  async getFolderAncestry(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FolderResponseDto[]> {
    try {
      return await this.foldersService.getAncestry(req.tenantId, id);
    } catch (error) {
      this.logger.error(`Error getting folder ancestry: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id/tree')
  @ApiOperation({ summary: 'Get a folder\'s full tree (all descendants)' })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  @ApiResponse({ status: 200, description: 'Tree of folders' })
  async getFolderTree(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<any> {
    try {
      return await this.foldersService.getFolderTree(req.tenantId, id);
    } catch (error) {
      this.logger.error(`Error getting folder tree: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('path/:path(*)')
  @ApiOperation({ summary: 'Get folder by path' })
  @ApiParam({ name: 'path', description: 'Folder path' })
  @ApiResponse({ status: 200, description: 'Folder details', type: FolderResponseDto })
  async getFolderByPath(
    @Req() req: Request,
    @Param('path') path: string,
  ): Promise<FolderResponseDto> {
    try {
      return await this.foldersService.findByPath(req.tenantId, path);
    } catch (error) {
      this.logger.error(`Error getting folder by path: ${error.message}`, error.stack);
      throw error;
    }
  }
}
