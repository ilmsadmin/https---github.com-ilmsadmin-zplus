import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, Like } from 'typeorm';
import { FolderEntity } from './entities/folder.entity';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { FolderResponseDto } from './dto/folder-response.dto';
import { FolderFilterDto } from './dto/folder-filter.dto';

@Injectable()
export class FoldersService {
  private readonly logger = new Logger(FoldersService.name);

  constructor(
    @InjectRepository(FolderEntity)
    private readonly folderRepository: Repository<FolderEntity>,
  ) {}

  /**
   * Create a new folder
   * @param tenantId The tenant ID
   * @param userId The user ID
   * @param createFolderDto Folder creation data
   * @returns The created folder
   */
  async createFolder(
    tenantId: string,
    userId: string,
    createFolderDto: CreateFolderDto,
  ): Promise<FolderResponseDto> {
    const { name, description, parentId, metadata } = createFolderDto;

    // Validate folder name
    if (!name || name.trim() === '') {
      throw new BadRequestException('Folder name cannot be empty');
    }
    
    // Check if parent folder exists if provided
    if (parentId) {
      const parentFolder = await this.folderRepository.findOne({
        where: { id: parentId, tenantId, deleted: false },
      });
      
      if (!parentFolder) {
        throw new NotFoundException(`Parent folder with ID ${parentId} not found`);
      }
    }

    // Check for duplicate folder name in the same parent
    const existingFolder = await this.folderRepository.findOne({
      where: {
        name,
        parentId: parentId || IsNull(),
        tenantId,
        deleted: false,
      },
    });

    if (existingFolder) {
      throw new ConflictException(`Folder with name "${name}" already exists in this location`);
    }

    // Determine folder path
    let folderPath = '';
    if (parentId) {
      const parentFolder = await this.folderRepository.findOne({
        where: { id: parentId, tenantId },
      });
      folderPath = parentFolder.path ? `${parentFolder.path}/${name}` : name;
    } else {
      folderPath = name;
    }

    // Create folder entity
    const newFolder = this.folderRepository.create({
      name,
      description,
      parentId,
      tenantId,
      creatorId: userId,
      ownerId: userId,
      path: folderPath,
      metadata: metadata || {},
    });

    // Save the folder
    const savedFolder = await this.folderRepository.save(newFolder);
    return this.mapToResponseDto(savedFolder);
  }

  /**
   * Get all folders with filtering
   * @param tenantId The tenant ID
   * @param filterDto Filter criteria
   * @returns List of folders
   */
  async findAll(
    tenantId: string,
    filterDto: FolderFilterDto,
  ): Promise<{ data: FolderResponseDto[]; total: number; page: number; limit: number }> {
    const {
      parentId,
      name,
      creatorId,
      ownerId,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 20,
    } = filterDto;

    const skip = (page - 1) * limit;

    // Build query conditions
    const where: any = {
      tenantId,
      deleted: false,
    };

    if (parentId === 'root') {
      where.parentId = IsNull();
    } else if (parentId) {
      where.parentId = parentId;
    }

    if (name) {
      where.name = Like(`%${name}%`);
    }

    if (creatorId) {
      where.creatorId = creatorId;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    // Execute query
    const [folders, total] = await this.folderRepository.findAndCount({
      where,
      order: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Map to response DTOs
    const data = folders.map(folder => this.mapToResponseDto(folder));

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Get folder by ID
   * @param tenantId The tenant ID
   * @param id The folder ID
   * @returns The folder
   */
  async findById(tenantId: string, id: string): Promise<FolderResponseDto> {
    const folder = await this.folderRepository.findOne({
      where: { id, tenantId, deleted: false },
      relations: ['parent'],
    });

    if (!folder) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    return this.mapToResponseDto(folder);
  }

  /**
   * Get folder by path
   * @param tenantId The tenant ID
   * @param path The folder path
   * @returns The folder
   */
  async findByPath(tenantId: string, path: string): Promise<FolderResponseDto> {
    const folder = await this.folderRepository.findOne({
      where: { path, tenantId, deleted: false },
    });

    if (!folder) {
      throw new NotFoundException(`Folder with path ${path} not found`);
    }

    return this.mapToResponseDto(folder);
  }

  /**
   * Update a folder
   * @param tenantId The tenant ID
   * @param id The folder ID
   * @param updateFolderDto Folder update data
   * @returns The updated folder
   */
  async updateFolder(
    tenantId: string,
    id: string,
    updateFolderDto: UpdateFolderDto,
  ): Promise<FolderResponseDto> {
    const { name, description, metadata, ownerId } = updateFolderDto;

    // Get the folder
    const folder = await this.folderRepository.findOne({
      where: { id, tenantId, deleted: false },
    });

    if (!folder) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    // If name is changing, check for duplicates
    if (name && name !== folder.name) {
      const existingFolder = await this.folderRepository.findOne({
        where: {
          name,
          parentId: folder.parentId || IsNull(),
          tenantId,
          id: Not(id),
          deleted: false,
        },
      });

      if (existingFolder) {
        throw new ConflictException(`Folder with name "${name}" already exists in this location`);
      }

      // Update path and children paths if name changes
      const oldPath = folder.path;
      const newPath = folder.parentId 
        ? await this.calculateNewPathForRename(folder.parentId, tenantId, name)
        : name;
          
      // Update the folder path
      folder.path = newPath;
      
      // Update all child folders with the new path
      await this.updateChildrenPaths(oldPath, newPath, tenantId);
    }

    // Update other fields
    if (name) folder.name = name;
    if (description !== undefined) folder.description = description;
    if (metadata) folder.metadata = { ...folder.metadata, ...metadata };
    if (ownerId) folder.ownerId = ownerId;

    const updatedFolder = await this.folderRepository.save(folder);
    return this.mapToResponseDto(updatedFolder);
  }

  /**
   * Move a folder to a new parent
   * @param tenantId The tenant ID
   * @param id The folder ID
   * @param newParentId The new parent folder ID
   * @returns The moved folder
   */
  async moveFolder(
    tenantId: string,
    id: string,
    newParentId: string | null,
  ): Promise<FolderResponseDto> {
    // Get the folder to move
    const folder = await this.folderRepository.findOne({
      where: { id, tenantId, deleted: false },
    });

    if (!folder) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    // Can't move to itself or to a child folder
    if (id === newParentId) {
      throw new BadRequestException('Cannot move a folder to itself');
    }

    // Check if the new parent exists if provided
    let newParentFolder = null;
    if (newParentId) {
      newParentFolder = await this.folderRepository.findOne({
        where: { id: newParentId, tenantId, deleted: false },
      });

      if (!newParentFolder) {
        throw new NotFoundException(`New parent folder with ID ${newParentId} not found`);
      }

      // Check if the new parent is a child of the folder to move
      const isChildFolder = await this.isChildFolder(id, newParentId, tenantId);
      if (isChildFolder) {
        throw new BadRequestException('Cannot move a folder to its own subfolder');
      }
    }

    // Check for duplicate folder name in the new parent
    const existingFolder = await this.folderRepository.findOne({
      where: {
        name: folder.name,
        parentId: newParentId || IsNull(),
        tenantId,
        id: Not(id),
        deleted: false,
      },
    });

    if (existingFolder) {
      throw new ConflictException(
        `Folder with name "${folder.name}" already exists in the destination folder`
      );
    }

    // Update folder's parent and path
    const oldPath = folder.path;
    const newPath = newParentId
      ? `${newParentFolder.path}/${folder.name}`
      : folder.name;

    folder.parentId = newParentId;
    folder.path = newPath;

    // Save the folder
    await this.folderRepository.save(folder);

    // Update paths of all children
    await this.updateChildrenPaths(oldPath, newPath, tenantId);

    return this.mapToResponseDto(folder);
  }

  /**
   * Delete a folder (soft delete)
   * @param tenantId The tenant ID
   * @param id The folder ID
   * @returns True if deleted successfully
   */
  async deleteFolder(tenantId: string, id: string): Promise<boolean> {
    const folder = await this.folderRepository.findOne({
      where: { id, tenantId, deleted: false },
    });

    if (!folder) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    // Mark folder as deleted
    folder.deleted = true;
    folder.deletedAt = new Date();
    await this.folderRepository.save(folder);

    // Also mark all subfolders as deleted
    await this.deleteFolderSubtree(folder.path, tenantId);

    return true;
  }

  /**
   * Permanently delete a folder
   * @param tenantId The tenant ID
   * @param id The folder ID
   * @returns True if deleted successfully
   */
  async permanentlyDeleteFolder(tenantId: string, id: string): Promise<boolean> {
    const folder = await this.folderRepository.findOne({
      where: { id, tenantId },
    });

    if (!folder) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    // Get all children folders to delete them all
    const childrenFolders = await this.folderRepository.find({
      where: {
        path: Like(`${folder.path}/%`),
        tenantId,
      },
    });

    // Delete all children first
    if (childrenFolders.length > 0) {
      await this.folderRepository.remove(childrenFolders);
    }

    // Delete the folder itself
    await this.folderRepository.remove(folder);

    return true;
  }

  /**
   * Get a folder's children
   * @param tenantId The tenant ID
   * @param id The folder ID
   * @returns List of child folders
   */
  async getChildren(tenantId: string, id: string): Promise<FolderResponseDto[]> {
    const folder = await this.folderRepository.findOne({
      where: { id, tenantId, deleted: false },
    });

    if (!folder) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    const children = await this.folderRepository.find({
      where: { parentId: id, tenantId, deleted: false },
      order: { name: 'ASC' },
    });

    return children.map(child => this.mapToResponseDto(child));
  }

  /**
   * Get folder ancestry (from root to the folder)
   * @param tenantId The tenant ID
   * @param id The folder ID
   * @returns List of ancestor folders
   */
  async getAncestry(tenantId: string, id: string): Promise<FolderResponseDto[]> {
    const folder = await this.folderRepository.findOne({
      where: { id, tenantId, deleted: false },
    });

    if (!folder) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    // If it's a root folder, return empty array
    if (!folder.parentId) {
      return [];
    }

    const ancestry: FolderEntity[] = [];
    let currentFolder = folder;

    // Build ancestry from bottom to top
    while (currentFolder.parentId) {
      const parent = await this.folderRepository.findOne({
        where: { id: currentFolder.parentId, tenantId },
      });

      if (!parent) {
        break;
      }

      ancestry.unshift(parent);
      currentFolder = parent;
    }

    return ancestry.map(ancestor => this.mapToResponseDto(ancestor));
  }

  /**
   * Get a folder's full tree (all descendants)
   * @param tenantId The tenant ID
   * @param id The folder ID
   * @returns Tree structure of all descendant folders
   */
  async getFolderTree(tenantId: string, id: string): Promise<any> {
    const folder = await this.folderRepository.findOne({
      where: { id, tenantId, deleted: false },
    });

    if (!folder) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    const result = this.mapToResponseDto(folder);
    
    // Find all immediate children
    const children = await this.folderRepository.find({
      where: { parentId: id, tenantId, deleted: false },
      order: { name: 'ASC' },
    });

    // Recursively build tree
    if (children.length > 0) {
      result.children = [];
      for (const child of children) {
        const childTree = await this.getFolderTree(tenantId, child.id);
        result.children.push(childTree);
      }
    }

    return result;
  }

  /**
   * Helper method to check if folder is a child of another folder
   */
  private async isChildFolder(parentId: string, childId: string, tenantId: string): Promise<boolean> {
    const child = await this.folderRepository.findOne({
      where: { id: childId, tenantId },
    });

    if (!child || !child.parentId) {
      return false;
    }

    if (child.parentId === parentId) {
      return true;
    }

    return this.isChildFolder(parentId, child.parentId, tenantId);
  }

  /**
   * Helper method to update paths of child folders
   */
  private async updateChildrenPaths(oldPath: string, newPath: string, tenantId: string): Promise<void> {
    const childFolders = await this.folderRepository.find({
      where: {
        path: Like(`${oldPath}/%`),
        tenantId,
      },
    });

    for (const childFolder of childFolders) {
      const updatedPath = childFolder.path.replace(oldPath, newPath);
      await this.folderRepository.update(
        { id: childFolder.id },
        { path: updatedPath }
      );
    }
  }

  /**
   * Calculate new path for a renamed folder
   */
  private async calculateNewPathForRename(
    parentId: string,
    tenantId: string,
    newName: string,
  ): Promise<string> {
    const parent = await this.folderRepository.findOne({
      where: { id: parentId, tenantId },
    });

    return parent ? `${parent.path}/${newName}` : newName;
  }

  /**
   * Delete a folder subtree
   */
  private async deleteFolderSubtree(folderPath: string, tenantId: string): Promise<void> {
    // Mark all subfolders as deleted
    await this.folderRepository.update(
      {
        path: Like(`${folderPath}/%`),
        tenantId,
        deleted: false,
      },
      {
        deleted: true,
        deletedAt: new Date(),
      }
    );
  }

  /**
   * Map folder entity to response DTO
   */
  private mapToResponseDto(folder: FolderEntity): FolderResponseDto {
    const response = new FolderResponseDto();
    response.id = folder.id;
    response.name = folder.name;
    response.description = folder.description;
    response.parentId = folder.parentId;
    response.path = folder.path;
    response.creatorId = folder.creatorId;
    response.ownerId = folder.ownerId;
    response.metadata = folder.metadata;
    response.createdAt = folder.createdAt;
    response.updatedAt = folder.updatedAt;
    
    if (folder.parent) {
      response.parentName = folder.parent.name;
    }
    
    return response;
  }
}
