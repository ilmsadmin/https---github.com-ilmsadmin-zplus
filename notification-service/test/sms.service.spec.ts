import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SmsService } from '../src/channels/sms/sms.service';
import { TenantsService } from '../src/tenants/tenants.service';
import * as Twilio from 'twilio';

// Mock Twilio
jest.mock('twilio');

describe('SmsService', () => {
  let service: SmsService;
  let configService: ConfigService;
  let tenantsService: TenantsService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockTenantsService = {
    getTenantSettings: jest.fn(),
  };

  // Mock Twilio client
  const mockTwilioClient = {
    messages: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Set up Twilio mock
    (Twilio as jest.Mock).mockReturnValue(mockTwilioClient);
    
    // Set up config defaults
    mockConfigService.get.mockImplementation((key) => {
      if (key === 'sms') {
        return {
          provider: 'twilio',
          from: '+15551234567',
          twilio: {
            accountSid: 'test-account-sid',
            authToken: 'test-auth-token',
          },
        };
      }
      return null;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: TenantsService,
          useValue: mockTenantsService,
        },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
    configService = module.get<ConfigService>(ConfigService);
    tenantsService = module.get<TenantsService>(TenantsService);

    // Reset the mock implementation for sending messages
    mockTwilioClient.messages.create.mockImplementation(() => {
      return Promise.resolve({
        sid: 'test-message-sid',
        status: 'sent',
      });
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initDefaultTwilioClient', () => {
    it('should initialize Twilio client if provider is twilio', () => {
      expect(Twilio).toHaveBeenCalled();
      const twilioConfig = mockConfigService.get('sms').twilio;
      expect(Twilio).toHaveBeenCalledWith(
        twilioConfig.accountSid,
        twilioConfig.authToken,
      );
    });

    it('should handle unsupported SMS providers', () => {
      jest.clearAllMocks();
      mockConfigService.get.mockImplementation((key) => {
        if (key === 'sms') {
          return {
            provider: 'unsupported-provider',
          };
        }
        return null;
      });

      // Re-initialize service to trigger constructor
      const service = new SmsService(configService, tenantsService);
      
      expect(Twilio).not.toHaveBeenCalled();
    });
  });

  describe('getTenantTwilioClient', () => {
    it('should return tenant-specific Twilio client if tenant has SMS settings', async () => {
      const tenantId = 'tenant-123';
      const tenantSmsSettings = {
        provider: 'twilio',
        from: '+15559876543',
        twilio: {
          accountSid: 'tenant-account-sid',
          authToken: 'tenant-auth-token',
        },
      };

      mockTenantsService.getTenantSettings.mockResolvedValue({
        sms: tenantSmsSettings,
      });

      // First call should create a new client
      await service.getTenantTwilioClient(tenantId);
      
      expect(tenantsService.getTenantSettings).toHaveBeenCalledWith(tenantId);
      expect(Twilio).toHaveBeenCalledWith(
        tenantSmsSettings.twilio.accountSid,
        tenantSmsSettings.twilio.authToken,
      );

      // Reset mocks to test caching
      jest.clearAllMocks();
      
      // Second call should use cached client
      await service.getTenantTwilioClient(tenantId);
      
      expect(tenantsService.getTenantSettings).not.toHaveBeenCalled();
      expect(Twilio).not.toHaveBeenCalled();
    });

    it('should return default Twilio client if tenant has no SMS settings', async () => {
      const tenantId = 'tenant-no-settings';
      
      mockTenantsService.getTenantSettings.mockResolvedValue({});

      const client = await service.getTenantTwilioClient(tenantId);
      
      expect(tenantsService.getTenantSettings).toHaveBeenCalledWith(tenantId);
      // Should return the default client
      expect(client).toBe(mockTwilioClient);
    });
  });

  describe('sendSms', () => {
    it('should send an SMS using the default Twilio client', async () => {
      const smsData = {
        to: '+15551234567',
        body: 'Test SMS message',
      };
      const tenantId = null;
      const defaultFrom = mockConfigService.get('sms').from;

      await service.sendSms(smsData, tenantId);

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        to: smsData.to,
        from: defaultFrom,
        body: smsData.body,
      });
    });

    it('should send an SMS using a tenant-specific Twilio client', async () => {
      const smsData = {
        to: '+15551234567',
        body: 'Test tenant-specific SMS message',
      };
      const tenantId = 'tenant-123';
      const tenantSmsSettings = {
        provider: 'twilio',
        from: '+15559876543',
        twilio: {
          accountSid: 'tenant-account-sid',
          authToken: 'tenant-auth-token',
        },
      };

      mockTenantsService.getTenantSettings.mockResolvedValue({
        sms: tenantSmsSettings,
      });

      // Create a new mock Twilio client for the tenant
      const tenantTwilioClient = {
        messages: {
          create: jest.fn().mockResolvedValue({
            sid: 'tenant-message-sid',
            status: 'sent',
          }),
        },
      };
      
      // Make Twilio() return our tenant-specific client
      (Twilio as jest.Mock).mockReturnValue(tenantTwilioClient);

      await service.sendSms(smsData, tenantId);

      expect(mockTenantsService.getTenantSettings).toHaveBeenCalledWith(tenantId);
      expect(tenantTwilioClient.messages.create).toHaveBeenCalledWith({
        to: smsData.to,
        from: tenantSmsSettings.from,
        body: smsData.body,
      });
    });

    it('should handle errors when sending SMS', async () => {
      const smsData = {
        to: '+15551234567',
        body: 'Test error message',
      };
      const tenantId = null;

      const error = new Error('Twilio API error');
      mockTwilioClient.messages.create.mockRejectedValue(error);

      await expect(service.sendSms(smsData, tenantId)).rejects.toThrow();
    });
  });
});
