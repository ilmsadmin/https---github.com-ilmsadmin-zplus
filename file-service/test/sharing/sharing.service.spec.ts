import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SharingService } from '../../src/modules/sharing/sharing.service';
import { FileShareEntity, ShareType, SharePermission } from '../../src/modules/sharing/entities/file-share.entity';
import { FilesService } from '../../src/modules/files/files.service';
import { EncryptionService } from '../../src/modules/security/encryption.service';
import { CreateShareDto } from '../../src/modules/sharing/dto/create-share.dto';
import { UpdateShareDto } from '../../src/modules/sharing/dto/update-share.dto';
import { NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

const mockFileShareRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  update: jest.fn(),
  increment: jest.fn(),
  remove: jest.fn(),
});

const mockFilesService = () => ({
  findById: jest.fn(),
  downloadFile: jest.fn(),
});

const mockEncryptionService = () => ({
  encrypt: jest.fn(),
  decrypt: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('SharingService', () => {
  let service: SharingService;
  let shareRepository: MockRepository<FileShareEntity>;
  let filesService: any;
  let encryptionService: any;

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const userId = '22222222-2222-2222-2222-222222222222';
  const fileId = '33333333-3333-3333-3333-333333333333';
  const shareId = '44444444-4444-4444-4444-444444444444';
  const accessKey = 'abcdef1234567890';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharingService,
        {
          provide: getRepositoryToken(FileShareEntity),
          useFactory: mockFileShareRepository,
        },
        {
          provide: FilesService,
          useFactory: mockFilesService,
        },
        {
          provide: EncryptionService,
          useFactory: mockEncryptionService,
        },
      ],
    }).compile();

    service = module.get<SharingService>(SharingService);
    shareRepository = module.get<MockRepository<FileShareEntity>>(
      getRepositoryToken(FileShareEntity),
    );
    filesService = module.get<FilesService>(FilesService);
    encryptionService = module.get<EncryptionService>(EncryptionService);

    // Mock bcrypt
    (bcrypt.hash as jest.Mock).mockImplementation(() => 'hashed_password');
    (bcrypt.compare as jest.Mock).mockImplementation(() => true);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createShare', () => {
    it('should create a user share successfully', async () => {
      const createShareDto: CreateShareDto = {
        fileId,
        type: ShareType.USER,
        sharedWith: '55555555-5555-5555-5555-555555555555',
        permission: SharePermission.VIEW,
      };

      const mockFile = {
        id: fileId,
        name: 'test-file.pdf',
        mimeType: 'application/pdf',
      };

      const createdShare = {
        id: shareId,
        ...createShareDto,
        tenantId,
        sharedBy: userId,
        accessKey: null,
        passwordProtected: false,
        passwordHash: null,
        downloadCount: 0,
        viewCount: 0,
        isActive: true,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      filesService.findById.mockResolvedValue(mockFile);
      shareRepository.create.mockReturnValue(createdShare);
      shareRepository.save.mockResolvedValue(createdShare);

      const result = await service.createShare(tenantId, userId, createShareDto);

      expect(filesService.findById).toHaveBeenCalledWith(tenantId, fileId);
      expect(shareRepository.create).toHaveBeenCalled();
      expect(shareRepository.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        id: shareId,
        fileId,
        type: ShareType.USER,
        sharedWith: '55555555-5555-5555-5555-555555555555',
        permission: SharePermission.VIEW,
      }));
    });

    it('should create a link share with password protection', async () => {
      const createShareDto: CreateShareDto = {
        fileId,
        type: ShareType.LINK,
        permission: SharePermission.DOWNLOAD,
        passwordProtected: true,
        password: 'secret123',
        expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
      };

      const mockFile = {
        id: fileId,
        name: 'test-file.pdf',
        mimeType: 'application/pdf',
      };

      const createdShare = {
        id: shareId,
        fileId,
        tenantId,
        type: ShareType.LINK,
        sharedWith: null,
        sharedBy: userId,
        permission: SharePermission.DOWNLOAD,
        accessKey,
        passwordProtected: true,
        passwordHash: 'hashed_password',
        expiresAt: createShareDto.expiresAt,
        downloadCount: 0,
        viewCount: 0,
        isActive: true,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      filesService.findById.mockResolvedValue(mockFile);
      shareRepository.create.mockReturnValue(createdShare);
      shareRepository.save.mockResolvedValue(createdShare);

      const result = await service.createShare(tenantId, userId, createShareDto);

      expect(filesService.findById).toHaveBeenCalledWith(tenantId, fileId);
      expect(bcrypt.hash).toHaveBeenCalledWith('secret123', expect.any(Number));
      expect(shareRepository.create).toHaveBeenCalled();
      expect(shareRepository.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        id: shareId,
        fileId,
        type: ShareType.LINK,
        permission: SharePermission.DOWNLOAD,
        passwordProtected: true,
      }));
      expect(result.accessKey).toBeTruthy();
      expect(result.shareUrl).toContain(result.accessKey);
    });

    it('should throw NotFoundException when file does not exist', async () => {
      const createShareDto: CreateShareDto = {
        fileId,
        type: ShareType.USER,
        sharedWith: '55555555-5555-5555-5555-555555555555',
        permission: SharePermission.VIEW,
      };

      filesService.findById.mockResolvedValue(null);

      await expect(service.createShare(tenantId, userId, createShareDto))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when sharedWith is missing for USER type', async () => {
      const createShareDto: CreateShareDto = {
        fileId,
        type: ShareType.USER,
        permission: SharePermission.VIEW,
      };

      const mockFile = {
        id: fileId,
        name: 'test-file.pdf',
        mimeType: 'application/pdf',
      };

      filesService.findById.mockResolvedValue(mockFile);

      await expect(service.createShare(tenantId, userId, createShareDto))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('should find a share by ID', async () => {
      const mockShare = {
        id: shareId,
        fileId,
        tenantId,
        type: ShareType.USER,
        sharedWith: '55555555-5555-5555-5555-555555555555',
        sharedBy: userId,
        permission: SharePermission.VIEW,
        accessKey: null,
        passwordProtected: false,
        passwordHash: null,
        downloadCount: 0,
        viewCount: 0,
        isActive: true,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        file: {
          name: 'test-file.pdf',
          mimeType: 'application/pdf',
        },
      };

      shareRepository.findOne.mockResolvedValue(mockShare);

      const result = await service.findById(tenantId, shareId);

      expect(shareRepository.findOne).toHaveBeenCalledWith({
        where: { id: shareId, tenantId },
        relations: ['file'],
      });
      expect(result).toEqual(expect.objectContaining({
        id: shareId,
        fileId,
        fileName: 'test-file.pdf',
        fileMimeType: 'application/pdf',
      }));
    });

    it('should throw NotFoundException when share does not exist', async () => {
      shareRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(tenantId, shareId))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when share has expired', async () => {
      const expiredShare = {
        id: shareId,
        expiresAt: new Date(Date.now() - 86400000), // 1 day ago
      };

      shareRepository.findOne.mockResolvedValue(expiredShare);

      await expect(service.findById(tenantId, shareId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('findByAccessKey', () => {
    it('should find a share by access key', async () => {
      const mockShare = {
        id: shareId,
        fileId,
        tenantId,
        type: ShareType.LINK,
        sharedWith: null,
        sharedBy: userId,
        permission: SharePermission.DOWNLOAD,
        accessKey,
        passwordProtected: false,
        passwordHash: null,
        downloadCount: 0,
        viewCount: 0,
        isActive: true,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        lastAccessed: null,
        file: {
          name: 'test-file.pdf',
          mimeType: 'application/pdf',
        },
      };

      shareRepository.findOne.mockResolvedValue(mockShare);
      shareRepository.save.mockResolvedValue({
        ...mockShare,
        lastAccessed: expect.any(Date),
      });

      const result = await service.findByAccessKey(accessKey);

      expect(shareRepository.findOne).toHaveBeenCalledWith({
        where: { accessKey, type: ShareType.LINK, isActive: true },
        relations: ['file'],
      });
      expect(shareRepository.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        id: shareId,
        fileId,
        fileName: 'test-file.pdf',
        fileMimeType: 'application/pdf',
        accessKey,
      }));
    });

    it('should throw NotFoundException when access key is invalid', async () => {
      shareRepository.findOne.mockResolvedValue(null);

      await expect(service.findByAccessKey('invalid-key'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('validateShareAccess', () => {
    it('should validate access to a non-password-protected share', async () => {
      const mockShare = {
        id: shareId,
        fileId,
        tenantId,
        type: ShareType.LINK,
        sharedWith: null,
        sharedBy: userId,
        permission: SharePermission.DOWNLOAD,
        accessKey,
        passwordProtected: false,
        passwordHash: null,
        expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
        downloadCount: 0,
        viewCount: 0,
        isActive: true,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        file: {
          name: 'test-file.pdf',
          mimeType: 'application/pdf',
        },
      };

      shareRepository.findOne.mockResolvedValue(mockShare);

      const result = await service.validateShareAccess(shareId);

      expect(shareRepository.findOne).toHaveBeenCalledWith({
        where: { id: shareId, isActive: true },
        relations: ['file'],
      });
      expect(result).toEqual(expect.objectContaining({
        id: shareId,
        fileId,
      }));
    });

    it('should validate access to a password-protected share with correct password', async () => {
      const mockShare = {
        id: shareId,
        fileId,
        tenantId,
        type: ShareType.LINK,
        sharedWith: null,
        sharedBy: userId,
        permission: SharePermission.DOWNLOAD,
        accessKey,
        passwordProtected: true,
        passwordHash: 'hashed_password',
        expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
        downloadCount: 0,
        viewCount: 0,
        isActive: true,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        file: {
          name: 'test-file.pdf',
          mimeType: 'application/pdf',
        },
      };

      shareRepository.findOne.mockResolvedValue(mockShare);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateShareAccess(shareId, null, 'correct-password');

      expect(shareRepository.findOne).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalledWith('correct-password', 'hashed_password');
      expect(result).toEqual(expect.objectContaining({
        id: shareId,
        fileId,
      }));
    });

    it('should throw UnauthorizedException when password is missing for protected share', async () => {
      const mockShare = {
        id: shareId,
        passwordProtected: true,
        passwordHash: 'hashed_password',
        expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
      };

      shareRepository.findOne.mockResolvedValue(mockShare);

      await expect(service.validateShareAccess(shareId))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const mockShare = {
        id: shareId,
        passwordProtected: true,
        passwordHash: 'hashed_password',
        expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
      };

      shareRepository.findOne.mockResolvedValue(mockShare);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateShareAccess(shareId, null, 'wrong-password'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when share has expired', async () => {
      const mockShare = {
        id: shareId,
        expiresAt: new Date(Date.now() - 86400000), // 1 day ago
      };

      shareRepository.findOne.mockResolvedValue(mockShare);

      await expect(service.validateShareAccess(shareId))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateShare', () => {
    it('should update a share successfully', async () => {
      const updateShareDto: UpdateShareDto = {
        permission: SharePermission.ADMIN,
        passwordProtected: true,
        password: 'new-password',
        expiresAt: new Date(Date.now() + 172800000), // 48 hours from now
      };

      const existingShare = {
        id: shareId,
        fileId,
        tenantId,
        type: ShareType.USER,
        sharedWith: '55555555-5555-5555-5555-555555555555',
        sharedBy: userId,
        permission: SharePermission.VIEW,
        passwordProtected: false,
        passwordHash: null,
        metadata: {},
        file: {
          name: 'test-file.pdf',
          mimeType: 'application/pdf',
        },
      };

      const updatedShare = {
        ...existingShare,
        permission: SharePermission.ADMIN,
        passwordProtected: true,
        passwordHash: 'hashed_password',
        expiresAt: updateShareDto.expiresAt,
      };

      shareRepository.findOne.mockResolvedValue(existingShare);
      shareRepository.save.mockResolvedValue(updatedShare);

      const result = await service.updateShare(tenantId, shareId, updateShareDto);

      expect(shareRepository.findOne).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('new-password', expect.any(Number));
      expect(shareRepository.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        id: shareId,
        permission: SharePermission.ADMIN,
        passwordProtected: true,
      }));
    });

    it('should throw NotFoundException when share does not exist', async () => {
      const updateShareDto: UpdateShareDto = {
        permission: SharePermission.ADMIN,
      };

      shareRepository.findOne.mockResolvedValue(null);

      await expect(service.updateShare(tenantId, shareId, updateShareDto))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteShare', () => {
    it('should delete a share successfully', async () => {
      const mockShare = {
        id: shareId,
        tenantId,
      };

      shareRepository.findOne.mockResolvedValue(mockShare);
      shareRepository.remove.mockResolvedValue({});

      const result = await service.deleteShare(tenantId, shareId);

      expect(shareRepository.findOne).toHaveBeenCalled();
      expect(shareRepository.remove).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw NotFoundException when share does not exist', async () => {
      shareRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteShare(tenantId, shareId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('incrementDownloadCount and incrementViewCount', () => {
    it('should increment download count', async () => {
      shareRepository.increment.mockResolvedValue({});
      shareRepository.update.mockResolvedValue({});

      await service.incrementDownloadCount(shareId);

      expect(shareRepository.increment).toHaveBeenCalledWith(
        { id: shareId },
        'downloadCount',
        1
      );
      expect(shareRepository.update).toHaveBeenCalledWith(
        { id: shareId },
        { lastAccessed: expect.any(Date) }
      );
    });

    it('should increment view count', async () => {
      shareRepository.increment.mockResolvedValue({});
      shareRepository.update.mockResolvedValue({});

      await service.incrementViewCount(shareId);

      expect(shareRepository.increment).toHaveBeenCalledWith(
        { id: shareId },
        'viewCount',
        1
      );
      expect(shareRepository.update).toHaveBeenCalledWith(
        { id: shareId },
        { lastAccessed: expect.any(Date) }
      );
    });
  });
});
