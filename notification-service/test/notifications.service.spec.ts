import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { NotificationsService } from '../src/notifications/notifications.service';
import { Notification } from '../src/notifications/entities/notification.entity';
import { CreateNotificationDto } from '../src/notifications/dto/create-notification.dto';
import { NotificationChannel } from '../src/notifications/enums/notification-channel.enum';
import { NotificationStatus } from '../src/notifications/enums/notification-status.enum';
import { NotificationPriority } from '../src/notifications/enums/notification-priority.enum';
import { TemplatesService } from '../src/templates/templates.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepository: Repository<Notification>;
  let eventEmitter: EventEmitter2;
  let templatesService: TemplatesService;

  const mockNotificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockTemplatesService = {
    findById: jest.fn(),
    findByCode: jest.fn(),
    renderTemplate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: TemplatesService,
          useValue: mockTemplatesService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationRepository = module.get<Repository<Notification>>(getRepositoryToken(Notification));
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    templatesService = module.get<TemplatesService>(TemplatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification without template', async () => {
      const createNotificationDto: CreateNotificationDto = {
        tenantId: 'tenant-123',
        userId: 'user-123',
        userEmail: 'user@example.com',
        subject: 'Test notification',
        content: 'This is a test notification',
        channels: [NotificationChannel.EMAIL],
        priority: NotificationPriority.NORMAL,
      };

      const expectedNotification = {
        id: 'notification-123',
        ...createNotificationDto,
        status: NotificationStatus.PENDING,
      };

      mockNotificationRepository.create.mockReturnValue(expectedNotification);
      mockNotificationRepository.save.mockResolvedValue(expectedNotification);

      const result = await service.create(createNotificationDto);

      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        ...createNotificationDto,
        status: NotificationStatus.PENDING,
      });
      expect(mockNotificationRepository.save).toHaveBeenCalledWith(expectedNotification);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('notification.created', expectedNotification);
      expect(result).toEqual(expectedNotification);
    });

    it('should create a scheduled notification', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const createNotificationDto: CreateNotificationDto = {
        tenantId: 'tenant-123',
        userId: 'user-123',
        userEmail: 'user@example.com',
        subject: 'Scheduled notification',
        content: 'This is a scheduled notification',
        channels: [NotificationChannel.EMAIL],
        priority: NotificationPriority.NORMAL,
        scheduledFor: tomorrow.toISOString(),
      };

      const expectedNotification = {
        id: 'notification-123',
        ...createNotificationDto,
        scheduledFor: tomorrow,
        status: NotificationStatus.SCHEDULED,
      };

      mockNotificationRepository.create.mockReturnValue(expectedNotification);
      mockNotificationRepository.save.mockResolvedValue(expectedNotification);

      const result = await service.create(createNotificationDto);

      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        ...createNotificationDto,
        status: NotificationStatus.SCHEDULED,
      });
      expect(mockNotificationRepository.save).toHaveBeenCalledWith(expectedNotification);
      expect(mockEventEmitter.emit).not.toHaveBeenCalled(); // Should not emit event for scheduled notifications
      expect(result).toEqual(expectedNotification);
    });

    it('should create a notification with template', async () => {
      const createNotificationDto: CreateNotificationDto = {
        tenantId: 'tenant-123',
        userId: 'user-123',
        userEmail: 'user@example.com',
        templateCode: 'welcome-email',
        subject: 'Placeholder subject',
        content: 'Placeholder content',
        channels: [NotificationChannel.EMAIL],
        variables: {
          name: 'John Doe',
          activationLink: 'https://example.com/activate',
        },
      };

      const mockTemplate = {
        id: 'template-123',
        code: 'welcome-email',
        name: 'Welcome Email',
        supportedChannels: [NotificationChannel.EMAIL],
      };

      const renderedTemplate = {
        subject: 'Welcome, John Doe!',
        content: '<p>Welcome to our platform, John Doe!</p><p>Click <a href="https://example.com/activate">here</a> to activate your account.</p>',
      };

      mockTemplatesService.findByCode.mockResolvedValue(mockTemplate);
      mockTemplatesService.renderTemplate.mockResolvedValue(renderedTemplate);

      const expectedNotification = {
        id: 'notification-123',
        tenantId: 'tenant-123',
        userId: 'user-123',
        userEmail: 'user@example.com',
        templateId: 'template-123',
        subject: renderedTemplate.subject,
        content: renderedTemplate.content,
        channels: [NotificationChannel.EMAIL],
        priority: NotificationPriority.NORMAL,
        status: NotificationStatus.PENDING,
        metadata: {
          originalTemplate: 'welcome-email',
          variables: createNotificationDto.variables,
        },
      };

      mockNotificationRepository.create.mockReturnValue(expectedNotification);
      mockNotificationRepository.save.mockResolvedValue(expectedNotification);

      const result = await service.create(createNotificationDto);

      expect(mockTemplatesService.findByCode).toHaveBeenCalledWith('welcome-email', 'tenant-123');
      expect(mockTemplatesService.renderTemplate).toHaveBeenCalledWith(mockTemplate, createNotificationDto.variables);
      expect(mockNotificationRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        tenantId: 'tenant-123',
        userId: 'user-123',
        userEmail: 'user@example.com',
        templateId: 'template-123',
        subject: renderedTemplate.subject,
        content: renderedTemplate.content,
        channels: [NotificationChannel.EMAIL],
        status: NotificationStatus.PENDING,
      }));
      expect(mockNotificationRepository.save).toHaveBeenCalledWith(expectedNotification);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('notification.created', expectedNotification);
      expect(result).toEqual(expectedNotification);
    });
  });

  describe('findOne', () => {
    it('should return a notification by ID', async () => {
      const mockNotification = {
        id: 'notification-123',
        tenantId: 'tenant-123',
        subject: 'Test notification',
        status: NotificationStatus.DELIVERED,
      };

      mockNotificationRepository.findOne.mockResolvedValue(mockNotification);

      const result = await service.findOne('notification-123', 'tenant-123');

      expect(mockNotificationRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 'notification-123',
          tenantId: 'tenant-123',
        },
      });
      expect(result).toEqual(mockNotification);
    });

    it('should throw NotFoundException if notification is not found', async () => {
      mockNotificationRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('not-exists', 'tenant-123')).rejects.toThrow();
    });
  });

  describe('markAsDelivered', () => {
    it('should mark a notification as delivered', async () => {
      const mockNotification = {
        id: 'notification-123',
        tenantId: 'tenant-123',
        subject: 'Test notification',
        status: NotificationStatus.PROCESSING,
        deliveryAttempts: [],
      };

      const expectedNotification = {
        ...mockNotification,
        status: NotificationStatus.DELIVERED,
        deliveryAttempts: [
          {
            channel: NotificationChannel.EMAIL,
            timestamp: expect.any(Date),
            success: true,
          },
        ],
        deliveredAt: expect.any(Date),
      };

      mockNotificationRepository.findOne.mockResolvedValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(expectedNotification);

      const result = await service.markAsDelivered('notification-123', NotificationChannel.EMAIL);

      expect(mockNotificationRepository.findOne).toHaveBeenCalled();
      expect(mockNotificationRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        status: NotificationStatus.DELIVERED,
        deliveryAttempts: expect.arrayContaining([
          expect.objectContaining({
            channel: NotificationChannel.EMAIL,
            success: true,
          }),
        ]),
        deliveredAt: expect.any(Date),
      }));
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('notification.delivered', expectedNotification);
      expect(result).toEqual(expectedNotification);
    });
  });
});
