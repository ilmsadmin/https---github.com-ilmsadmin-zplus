import { Test, TestingModule } from '@nestjs/testing';
import { NotificationProcessor } from '../src/notifications/processors/notification.processor';
import { NotificationsService } from '../src/notifications/notifications.service';
import { EmailService } from '../src/channels/email/email.service';
import { PushService } from '../src/channels/push/push.service';
import { SmsService } from '../src/channels/sms/sms.service';
import { InAppService } from '../src/channels/in-app/in-app.service';
import { Notification } from '../src/notifications/entities/notification.entity';
import { NotificationChannel } from '../src/notifications/enums/notification-channel.enum';
import { NotificationStatus } from '../src/notifications/enums/notification-status.enum';
import { NotificationPriority } from '../src/notifications/enums/notification-priority.enum';

describe('NotificationProcessor', () => {
  let processor: NotificationProcessor;
  let notificationsService: NotificationsService;
  let emailService: EmailService;
  let pushService: PushService;
  let smsService: SmsService;
  let inAppService: InAppService;

  const mockNotificationsService = {
    update: jest.fn(),
    saveDeliveryAttempt: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  const mockPushService = {
    sendPushNotification: jest.fn(),
  };

  const mockSmsService = {
    sendSms: jest.fn(),
  };

  const mockInAppService = {
    createInAppNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationProcessor,
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: PushService,
          useValue: mockPushService,
        },
        {
          provide: SmsService,
          useValue: mockSmsService,
        },
        {
          provide: InAppService,
          useValue: mockInAppService,
        },
      ],
    }).compile();

    processor = module.get<NotificationProcessor>(NotificationProcessor);
    notificationsService = module.get<NotificationsService>(NotificationsService);
    emailService = module.get<EmailService>(EmailService);
    pushService = module.get<PushService>(PushService);
    smsService = module.get<SmsService>(SmsService);
    inAppService = module.get<InAppService>(InAppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('handleNotificationCreated', () => {
    it('should process an email notification successfully', async () => {
      const mockNotification = {
        id: 'notification-1',
        tenantId: 'tenant-123',
        userId: 'user-123',
        userEmail: 'user@example.com',
        title: 'Test Email Notification',
        content: 'This is a test email notification',
        channels: [NotificationChannel.EMAIL],
        status: NotificationStatus.PENDING,
        priority: NotificationPriority.NORMAL,
        data: {},
        metadata: { emailTemplate: 'test-template' },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Notification;

      // Success response from email service
      mockEmailService.sendEmail.mockResolvedValue({
        messageId: 'test-message-id',
        success: true,
      });

      await processor.handleNotificationCreated(mockNotification);

      // Verify notification was marked as processing
      expect(mockNotificationsService.update).toHaveBeenCalledWith(
        mockNotification.id,
        expect.objectContaining({ status: NotificationStatus.PROCESSING }),
      );

      // Verify email service was called
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockNotification.userEmail,
          subject: mockNotification.title,
        }),
        mockNotification.tenantId,
      );

      // Verify delivery attempt was recorded
      expect(mockNotificationsService.saveDeliveryAttempt).toHaveBeenCalledWith(
        mockNotification.id,
        NotificationChannel.EMAIL,
        true,
        expect.any(Object),
      );

      // Verify notification was marked as delivered
      expect(mockNotificationsService.update).toHaveBeenCalledWith(
        mockNotification.id,
        expect.objectContaining({ status: NotificationStatus.DELIVERED }),
      );
    });

    it('should process a push notification successfully', async () => {
      const mockNotification = {
        id: 'notification-2',
        tenantId: 'tenant-123',
        userId: 'user-123',
        userDeviceToken: 'device-token-123',
        title: 'Test Push Notification',
        content: 'This is a test push notification',
        channels: [NotificationChannel.PUSH],
        status: NotificationStatus.PENDING,
        priority: NotificationPriority.HIGH,
        data: { action: 'VIEW_ORDER', orderId: '12345' },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Notification;

      // Success response from push service
      mockPushService.sendPushNotification.mockResolvedValue({
        messageId: 'push-message-id',
        success: true,
      });

      await processor.handleNotificationCreated(mockNotification);

      // Verify notification was marked as processing
      expect(mockNotificationsService.update).toHaveBeenCalledWith(
        mockNotification.id,
        expect.objectContaining({ status: NotificationStatus.PROCESSING }),
      );

      // Verify push service was called
      expect(mockPushService.sendPushNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          token: mockNotification.userDeviceToken,
          title: mockNotification.title,
          body: mockNotification.content,
          data: mockNotification.data,
        }),
        mockNotification.tenantId,
      );

      // Verify delivery attempt was recorded
      expect(mockNotificationsService.saveDeliveryAttempt).toHaveBeenCalledWith(
        mockNotification.id,
        NotificationChannel.PUSH,
        true,
        expect.any(Object),
      );

      // Verify notification was marked as delivered
      expect(mockNotificationsService.update).toHaveBeenCalledWith(
        mockNotification.id,
        expect.objectContaining({ status: NotificationStatus.DELIVERED }),
      );
    });

    it('should process a multi-channel notification', async () => {
      const mockNotification = {
        id: 'notification-3',
        tenantId: 'tenant-123',
        userId: 'user-123',
        userEmail: 'user@example.com',
        userDeviceToken: 'device-token-123',
        title: 'Test Multi-channel Notification',
        content: 'This is a test notification via multiple channels',
        channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP],
        status: NotificationStatus.PENDING,
        priority: NotificationPriority.URGENT,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Notification;

      // Mock success responses
      mockEmailService.sendEmail.mockResolvedValue({ messageId: 'email-id', success: true });
      mockPushService.sendPushNotification.mockResolvedValue({ messageId: 'push-id', success: true });
      mockInAppService.createInAppNotification.mockResolvedValue({ id: 'in-app-id', success: true });

      await processor.handleNotificationCreated(mockNotification);

      // Verify each channel service was called
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
      expect(mockPushService.sendPushNotification).toHaveBeenCalled();
      expect(mockInAppService.createInAppNotification).toHaveBeenCalled();

      // Verify delivery attempts were recorded for each channel
      expect(mockNotificationsService.saveDeliveryAttempt).toHaveBeenCalledTimes(3);

      // Verify notification was marked as delivered
      expect(mockNotificationsService.update).toHaveBeenCalledWith(
        mockNotification.id,
        expect.objectContaining({ status: NotificationStatus.DELIVERED }),
      );
    });

    it('should handle delivery failures', async () => {
      const mockNotification = {
        id: 'notification-4',
        tenantId: 'tenant-123',
        userId: 'user-123',
        userEmail: 'user@example.com',
        title: 'Test Failed Notification',
        content: 'This is a test notification that fails',
        channels: [NotificationChannel.EMAIL],
        status: NotificationStatus.PENDING,
        priority: NotificationPriority.NORMAL,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Notification;

      // Simulate a delivery failure
      const error = new Error('Delivery failed');
      mockEmailService.sendEmail.mockRejectedValue(error);

      await processor.handleNotificationCreated(mockNotification);

      // Verify notification was marked as processing
      expect(mockNotificationsService.update).toHaveBeenCalledWith(
        mockNotification.id,
        expect.objectContaining({ status: NotificationStatus.PROCESSING }),
      );

      // Verify email service was attempted
      expect(mockEmailService.sendEmail).toHaveBeenCalled();

      // Verify failed delivery attempt was recorded
      expect(mockNotificationsService.saveDeliveryAttempt).toHaveBeenCalledWith(
        mockNotification.id,
        NotificationChannel.EMAIL,
        false,
        expect.objectContaining({ error: error.message }),
      );

      // Verify notification was marked as failed
      expect(mockNotificationsService.update).toHaveBeenCalledWith(
        mockNotification.id,
        expect.objectContaining({ status: NotificationStatus.FAILED }),
      );
    });

    it('should mark as partially delivered when some channels succeed and others fail', async () => {
      const mockNotification = {
        id: 'notification-5',
        tenantId: 'tenant-123',
        userId: 'user-123',
        userEmail: 'user@example.com',
        userDeviceToken: 'device-token-123',
        userPhone: '+15551234567',
        title: 'Test Partial Delivery',
        content: 'This is a test notification with partial delivery',
        channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.SMS],
        status: NotificationStatus.PENDING,
        priority: NotificationPriority.HIGH,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Notification;

      // Email succeeds, push fails, SMS succeeds
      mockEmailService.sendEmail.mockResolvedValue({ messageId: 'email-id', success: true });
      mockPushService.sendPushNotification.mockRejectedValue(new Error('Push delivery failed'));
      mockSmsService.sendSms.mockResolvedValue({ messageId: 'sms-id', success: true });

      await processor.handleNotificationCreated(mockNotification);

      // Verify services were called
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
      expect(mockPushService.sendPushNotification).toHaveBeenCalled();
      expect(mockSmsService.sendSms).toHaveBeenCalled();

      // Verify delivery attempts were recorded
      expect(mockNotificationsService.saveDeliveryAttempt).toHaveBeenCalledTimes(3);

      // Verify notification was marked as partially delivered
      expect(mockNotificationsService.update).toHaveBeenCalledWith(
        mockNotification.id,
        expect.objectContaining({ status: NotificationStatus.PARTIALLY_DELIVERED }),
      );
    });
  });
});
