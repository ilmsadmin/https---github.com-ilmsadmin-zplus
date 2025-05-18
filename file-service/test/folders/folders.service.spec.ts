import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FoldersService } from '../../src/modules/folders/folders.service';
import { FolderEntity } from '../../src/modules/folders/entities/folder.entity';
import { CreateFolderDto } from '../../src/modules/folders/dto/create-folder.dto';
import { UpdateFolderDto } from '../../src/modules/folders/dto/update-folder.dto';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

const mockFolderRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('FoldersService', () => {
  let service: FoldersService;
  let folderRepository: MockRepository<FolderEntity>;

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const userId = '22222222-2222-2222-2222-222222222222';
  const folderId = '33333333-3333-3333-3333-333333333333';
  const parentFolderId = '44444444-4444-4444-4444-444444444444';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoldersService,
        {
          provide: getRepositoryToken(FolderEntity),
          useFactory: mockFolderRepository,
        },
      ],
    }).compile();

    service = module.get<FoldersService>(FoldersService);
    folderRepository = module.get<MockRepository<FolderEntity>>(
      getRepositoryToken(FolderEntity),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFolder', () => {
    it('should create a root folder successfully', async () => {
      const createFolderDto: CreateFolderDto = {
        name: 'Test Folder',
        description: 'Test folder description',
      };

      const createdFolder = {
        id: folderId,
        ...createFolderDto,
        tenantId,
        creatorId: userId,
        ownerId: userId,
        path: 'Test Folder',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      folderRepository.findOne.mockResolvedValue(null); // No existing folder
      folderRepository.create.mockReturnValue(createdFolder);
      folderRepository.save.mockResolvedValue(createdFolder);

      const result = await service.createFolder(tenantId, userId, createFolderDto);

      expect(folderRepository.findOne).toHaveBeenCalled();
      expect(folderRepository.create).toHaveBeenCalled();
      expect(folderRepository.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        id: folderId,
        name: 'Test Folder',
        description: 'Test folder description',
        path: 'Test Folder',
      }));
    });

    it('should create a subfolder successfully', async () => {
      const createFolderDto: CreateFolderDto = {
        name: 'Subfolder',
        description: 'Subfolder description',
        parentId: parentFolderId,
      };

      const parentFolder = {
        id: parentFolderId,
        name: 'Parent Folder',
        path: 'Parent Folder',
        tenantId,
      };

      const createdFolder = {
        id: folderId,
        ...createFolderDto,
        tenantId,
        creatorId: userId,
        ownerId: userId,
        path: 'Parent Folder/Subfolder',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      folderRepository.findOne
        .mockResolvedValueOnce(parentFolder) // Parent folder check
        .mockResolvedValueOnce(null); // Duplicate check
      folderRepository.create.mockReturnValue(createdFolder);
      folderRepository.save.mockResolvedValue(createdFolder);

      const result = await service.createFolder(tenantId, userId, createFolderDto);

      expect(folderRepository.findOne).toHaveBeenCalledTimes(2);
      expect(folderRepository.create).toHaveBeenCalled();
      expect(folderRepository.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        id: folderId,
        name: 'Subfolder',
        description: 'Subfolder description',
        path: 'Parent Folder/Subfolder',
      }));
    });

    it('should throw NotFoundException when parent folder does not exist', async () => {
      const createFolderDto: CreateFolderDto = {
        name: 'Subfolder',
        description: 'Subfolder description',
        parentId: parentFolderId,
      };

      folderRepository.findOne.mockResolvedValue(null); // Parent not found

      await expect(service.createFolder(tenantId, userId, createFolderDto))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when folder with same name exists', async () => {
      const createFolderDto: CreateFolderDto = {
        name: 'Test Folder',
        description: 'Test folder description',
      };

      const existingFolder = {
        id: '55555555-5555-5555-5555-555555555555',
        name: 'Test Folder',
        tenantId,
        deleted: false,
      };

      folderRepository.findOne.mockResolvedValue(existingFolder); // Existing folder with same name

      await expect(service.createFolder(tenantId, userId, createFolderDto))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should find a folder by ID', async () => {
      const mockFolder = {
        id: folderId,
        name: 'Test Folder',
        description: 'Test folder description',
        tenantId,
        parentId: null,
        path: 'Test Folder',
        creatorId: userId,
        ownerId: userId,
        metadata: {},
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      folderRepository.findOne.mockResolvedValue(mockFolder);

      const result = await service.findById(tenantId, folderId);

      expect(folderRepository.findOne).toHaveBeenCalledWith({
        where: { id: folderId, tenantId, deleted: false },
        relations: ['parent'],
      });
      expect(result).toEqual(expect.objectContaining({
        id: folderId,
        name: 'Test Folder',
      }));
    });

    it('should throw NotFoundException when folder does not exist', async () => {
      folderRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(tenantId, folderId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('updateFolder', () => {
    it('should update a folder successfully', async () => {
      const updateFolderDto: UpdateFolderDto = {
        name: 'Updated Folder Name',
        description: 'Updated description',
      };

      const existingFolder = {
        id: folderId,
        name: 'Test Folder',
        description: 'Test folder description',
        tenantId,
        parentId: null,
        path: 'Test Folder',
        creatorId: userId,
        ownerId: userId,
        metadata: {},
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedFolder = {
        ...existingFolder,
        ...updateFolderDto,
        path: 'Updated Folder Name',
      };

      folderRepository.findOne
        .mockResolvedValueOnce(existingFolder) // Get folder
        .mockResolvedValueOnce(null); // Duplicate check
      folderRepository.save.mockResolvedValue(updatedFolder);

      const result = await service.updateFolder(tenantId, folderId, updateFolderDto);

      expect(folderRepository.findOne).toHaveBeenCalledTimes(2);
      expect(folderRepository.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        id: folderId,
        name: 'Updated Folder Name',
        description: 'Updated description',
      }));
    });

    it('should throw NotFoundException when folder does not exist', async () => {
      const updateFolderDto: UpdateFolderDto = {
        name: 'Updated Folder Name',
      };

      folderRepository.findOne.mockResolvedValue(null);

      await expect(service.updateFolder(tenantId, folderId, updateFolderDto))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when updating to a name that already exists', async () => {
      const updateFolderDto: UpdateFolderDto = {
        name: 'Existing Folder',
      };

      const existingFolder = {
        id: folderId,
        name: 'Test Folder',
        tenantId,
        parentId: null,
        path: 'Test Folder',
        deleted: false,
      };

      const duplicateFolder = {
        id: '55555555-5555-5555-5555-555555555555',
        name: 'Existing Folder',
        tenantId,
        parentId: null,
        deleted: false,
      };

      folderRepository.findOne
        .mockResolvedValueOnce(existingFolder) // Get folder
        .mockResolvedValueOnce(duplicateFolder); // Duplicate check

      await expect(service.updateFolder(tenantId, folderId, updateFolderDto))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('deleteFolder', () => {
    it('should soft delete a folder successfully', async () => {
      const mockFolder = {
        id: folderId,
        name: 'Test Folder',
        tenantId,
        path: 'Test Folder',
        deleted: false,
      };

      folderRepository.findOne.mockResolvedValue(mockFolder);
      folderRepository.save.mockResolvedValue({ ...mockFolder, deleted: true, deletedAt: expect.any(Date) });
      folderRepository.update.mockResolvedValue({ affected: 5 }); // 5 subfolders affected

      const result = await service.deleteFolder(tenantId, folderId);

      expect(folderRepository.findOne).toHaveBeenCalled();
      expect(folderRepository.save).toHaveBeenCalled();
      expect(folderRepository.update).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw NotFoundException when folder does not exist', async () => {
      folderRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteFolder(tenantId, folderId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('moveFolder', () => {
    it('should move a folder to a new parent successfully', async () => {
      const folderToMove = {
        id: folderId,
        name: 'Test Folder',
        tenantId,
        parentId: null,
        path: 'Test Folder',
        deleted: false,
      };

      const newParentFolder = {
        id: parentFolderId,
        name: 'New Parent',
        tenantId,
        parentId: null,
        path: 'New Parent',
        deleted: false,
      };

      const movedFolder = {
        ...folderToMove,
        parentId: parentFolderId,
        path: 'New Parent/Test Folder',
      };

      folderRepository.findOne
        .mockResolvedValueOnce(folderToMove) // Get folder to move
        .mockResolvedValueOnce(newParentFolder) // Get new parent
        .mockResolvedValueOnce(null); // Duplicate check

      folderRepository.save.mockResolvedValue(movedFolder);

      const result = await service.moveFolder(tenantId, folderId, parentFolderId);

      expect(folderRepository.findOne).toHaveBeenCalledTimes(3);
      expect(folderRepository.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        id: folderId,
        parentId: parentFolderId,
        path: 'New Parent/Test Folder',
      }));
    });

    it('should throw BadRequestException when trying to move to itself', async () => {
      const folderToMove = {
        id: folderId,
        name: 'Test Folder',
        tenantId,
        parentId: null,
        path: 'Test Folder',
        deleted: false,
      };

      folderRepository.findOne.mockResolvedValue(folderToMove);

      await expect(service.moveFolder(tenantId, folderId, folderId))
        .rejects.toThrow(BadRequestException);
    });
  });
});
