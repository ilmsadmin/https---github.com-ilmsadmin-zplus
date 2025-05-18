import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PreferencesService } from '../src/preferences/preferences.service';
import { NotificationPreference } from '../src/preferences/entities/notification-preference.entity';
import { NotificationChannel } from '../src/notifications/enums/notification-channel.enum';
import { NotFoundException } from '@nestjs/common';

describe('PreferencesService', () => {
  let service: PreferencesService;
  let preferenceRepository: Repository<NotificationPreference>;

  const mockPreferenceRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreferencesService,
        {
          provide: getRepositoryToken(NotificationPreference),
          useValue: mockPreferenceRepository,
        },
      ],
    }).compile();

    service = module.get<PreferencesService>(PreferencesService);
    preferenceRepository = module.get<Repository<NotificationPreference>>(
      getRepositoryToken(NotificationPreference),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPreferences', () => {
    it('should return user preferences for a tenant', async () => {
      const userId = 'user-123';
      const tenantId = 'tenant-123';
      const preferences = [
        {
          id: 'pref-1',
          userId,
          tenantId,
          categoryCode: 'general',
          channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'pref-2',
          userId,
          tenantId,
          categoryCode: 'marketing',
          channels: [NotificationChannel.EMAIL],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPreferenceRepository.find.mockResolvedValue(preferences);

      const result = await service.getPreferences(userId, tenantId);

      expect(mockPreferenceRepository.find).toHaveBeenCalledWith({
        where: { userId, tenantId },
      });
      expect(result).toEqual(preferences);
    });
  });

  describe('getPreferencesByCategory', () => {
    it('should return user preferences for a specific category', async () => {
      const userId = 'user-123';
      const tenantId = 'tenant-123';
      const categoryCode = 'general';
      const preference = {
        id: 'pref-1',
        userId,
        tenantId,
        categoryCode,
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPreferenceRepository.findOne.mockResolvedValue(preference);

      const result = await service.getPreferencesByCategory(userId, tenantId, categoryCode);

      expect(mockPreferenceRepository.findOne).toHaveBeenCalledWith({
        where: { userId, tenantId, categoryCode },
      });
      expect(result).toEqual(preference);
    });

    it('should create default preferences when none exist for category', async () => {
      const userId = 'user-123';
      const tenantId = 'tenant-123';
      const categoryCode = 'general';
      const defaultPreference = {
        userId,
        tenantId,
        categoryCode,
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      };
      const savedDefaultPreference = {
        id: 'pref-new',
        ...defaultPreference,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPreferenceRepository.findOne.mockResolvedValue(null);
      mockPreferenceRepository.create.mockReturnValue(defaultPreference);
      mockPreferenceRepository.save.mockResolvedValue(savedDefaultPreference);

      const result = await service.getPreferencesByCategory(userId, tenantId, categoryCode);

      expect(mockPreferenceRepository.findOne).toHaveBeenCalledWith({
        where: { userId, tenantId, categoryCode },
      });
      expect(mockPreferenceRepository.create).toHaveBeenCalled();
      expect(mockPreferenceRepository.save).toHaveBeenCalled();
      expect(result).toEqual(savedDefaultPreference);
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences for a category', async () => {
      const userId = 'user-123';
      const tenantId = 'tenant-123';
      const categoryCode = 'general';
      const channels = [NotificationChannel.EMAIL, NotificationChannel.PUSH];
      const existingPreference = {
        id: 'pref-1',
        userId,
        tenantId,
        categoryCode,
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updatedPreference = {
        ...existingPreference,
        channels,
        updatedAt: expect.any(Date),
      };

      mockPreferenceRepository.findOne.mockResolvedValue(existingPreference);
      mockPreferenceRepository.save.mockResolvedValue(updatedPreference);

      const result = await service.updatePreferences(userId, tenantId, categoryCode, channels);

      expect(mockPreferenceRepository.findOne).toHaveBeenCalledWith({
        where: { userId, tenantId, categoryCode },
      });
      expect(mockPreferenceRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedPreference);
    });

    it('should create preferences when updating non-existent preferences', async () => {
      const userId = 'user-123';
      const tenantId = 'tenant-123';
      const categoryCode = 'new-category';
      const channels = [NotificationChannel.EMAIL];
      const newPreference = {
        userId,
        tenantId,
        categoryCode,
        channels,
      };
      const savedNewPreference = {
        id: 'pref-new',
        ...newPreference,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPreferenceRepository.findOne.mockResolvedValue(null);
      mockPreferenceRepository.create.mockReturnValue(newPreference);
      mockPreferenceRepository.save.mockResolvedValue(savedNewPreference);

      const result = await service.updatePreferences(userId, tenantId, categoryCode, channels);

      expect(mockPreferenceRepository.findOne).toHaveBeenCalledWith({
        where: { userId, tenantId, categoryCode },
      });
      expect(mockPreferenceRepository.create).toHaveBeenCalled();
      expect(mockPreferenceRepository.save).toHaveBeenCalled();
      expect(result).toEqual(savedNewPreference);
    });
  });

  describe('disableAllChannels', () => {
    it('should disable all notification channels for a user', async () => {
      const userId = 'user-123';
      const tenantId = 'tenant-123';
      const preferences = [
        {
          id: 'pref-1',
          userId,
          tenantId,
          categoryCode: 'general',
          channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        },
        {
          id: 'pref-2',
          userId,
          tenantId,
          categoryCode: 'marketing',
          channels: [NotificationChannel.EMAIL],
        },
      ];
      const emptyChannelsPreferences = preferences.map(pref => ({
        ...pref,
        channels: [],
      }));

      mockPreferenceRepository.find.mockResolvedValue(preferences);
      mockPreferenceRepository.save.mockResolvedValue(emptyChannelsPreferences);

      await service.disableAllChannels(userId, tenantId);

      expect(mockPreferenceRepository.find).toHaveBeenCalledWith({
        where: { userId, tenantId },
      });
      expect(mockPreferenceRepository.save).toHaveBeenCalled();
      expect(mockPreferenceRepository.save.mock.calls[0][0].every(pref => pref.channels.length === 0)).toBe(true);
    });
  });

  describe('enableChannel', () => {
    it('should enable a specific channel across all categories', async () => {
      const userId = 'user-123';
      const tenantId = 'tenant-123';
      const channel = NotificationChannel.PUSH;
      const preferences = [
        {
          id: 'pref-1',
          userId,
          tenantId,
          categoryCode: 'general',
          channels: [NotificationChannel.EMAIL],
        },
        {
          id: 'pref-2',
          userId,
          tenantId,
          categoryCode: 'marketing',
          channels: [],
        },
      ];
      const updatedPreferences = preferences.map(pref => ({
        ...pref,
        channels: [...pref.channels, channel],
      }));

      mockPreferenceRepository.find.mockResolvedValue(preferences);
      mockPreferenceRepository.save.mockResolvedValue(updatedPreferences);

      await service.enableChannel(userId, tenantId, channel);

      expect(mockPreferenceRepository.find).toHaveBeenCalledWith({
        where: { userId, tenantId },
      });
      expect(mockPreferenceRepository.save).toHaveBeenCalled();
      expect(mockPreferenceRepository.save.mock.calls[0][0].every(pref => pref.channels.includes(channel))).toBe(true);
    });
  });

  describe('disableChannel', () => {
    it('should disable a specific channel across all categories', async () => {
      const userId = 'user-123';
      const tenantId = 'tenant-123';
      const channel = NotificationChannel.EMAIL;
      const preferences = [
        {
          id: 'pref-1',
          userId,
          tenantId,
          categoryCode: 'general',
          channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        },
        {
          id: 'pref-2',
          userId,
          tenantId,
          categoryCode: 'marketing',
          channels: [NotificationChannel.EMAIL],
        },
      ];
      const updatedPreferences = preferences.map(pref => ({
        ...pref,
        channels: pref.channels.filter(ch => ch !== channel),
      }));

      mockPreferenceRepository.find.mockResolvedValue(preferences);
      mockPreferenceRepository.save.mockResolvedValue(updatedPreferences);

      await service.disableChannel(userId, tenantId, channel);

      expect(mockPreferenceRepository.find).toHaveBeenCalledWith({
        where: { userId, tenantId },
      });
      expect(mockPreferenceRepository.save).toHaveBeenCalled();
      expect(mockPreferenceRepository.save.mock.calls[0][0].every(pref => !pref.channels.includes(channel))).toBe(true);
    });
  });
});
