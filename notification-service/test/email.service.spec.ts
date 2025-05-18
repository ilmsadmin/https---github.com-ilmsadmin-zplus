import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../src/channels/email/email.service';
import { TenantsService } from '../src/tenants/tenants.service';
import * as nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer');

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;
  let tenantsService: TenantsService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockTenantsService = {
    getTenantSettings: jest.fn(),
  };

  // Mock for nodemailer's createTransport
  const mockTransporter = {
    sendMail: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Mock the nodemailer createTransport function
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
    
    // Set up config defaults
    mockConfigService.get.mockImplementation((key) => {
      if (key === 'email') {
        return {
          provider: 'smtp',
          from: 'test@example.com',
          smtp: {
            host: 'smtp.example.com',
            port: 587,
            secure: false,
            auth: {
              user: 'testuser',
              pass: 'testpass',
            },
          },
        };
      }
      return null;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
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

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
    tenantsService = module.get<TenantsService>(TenantsService);

    // Reset the mock implementation for each test
    mockTransporter.sendMail.mockImplementation((mailOptions) => {
      return Promise.resolve({
        messageId: 'mock-message-id',
        envelope: {},
        accepted: [mailOptions.to],
        rejected: [],
        pending: [],
        response: 'OK',
      });
    });

    mockTransporter.verify.mockResolvedValue(true);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initDefaultTransporter', () => {
    it('should initialize SMTP transporter if provider is smtp', () => {
      expect(nodemailer.createTransport).toHaveBeenCalled();
      const smtpConfig = mockConfigService.get('email').smtp;
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        auth: smtpConfig.auth,
      });
    });

    it('should initialize Sendgrid transporter if provider is sendgrid', () => {
      jest.clearAllMocks();
      mockConfigService.get.mockImplementation((key) => {
        if (key === 'email') {
          return {
            provider: 'sendgrid',
            from: 'test@example.com',
            sendgrid: {
              apiKey: 'SG.test-key',
            },
          };
        }
        return null;
      });

      // Re-initialize to trigger constructor that sets up transporter
      const service = new EmailService(configService, tenantsService);
      
      expect(nodemailer.createTransport).toHaveBeenCalled();
      // Note: We can't easily test the exact parameters due to the external 
      // nodemailer-sendgrid package, but we can verify it was called
    });
  });

  describe('getTenantTransporter', () => {
    it('should return tenant-specific transporter if tenant has email settings', async () => {
      const tenantId = 'tenant-123';
      const tenantEmailSettings = {
        provider: 'smtp',
        smtp: {
          host: 'tenant-smtp.example.com',
          port: 465,
          secure: true,
          auth: {
            user: 'tenant-user',
            pass: 'tenant-pass',
          },
        },
      };

      mockTenantsService.getTenantSettings.mockResolvedValue({
        email: tenantEmailSettings,
      });

      // First call should create a new transporter
      await service.getTenantTransporter(tenantId);
      
      expect(tenantsService.getTenantSettings).toHaveBeenCalledWith(tenantId);
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: tenantEmailSettings.smtp.host,
        port: tenantEmailSettings.smtp.port,
        secure: tenantEmailSettings.smtp.secure,
        auth: tenantEmailSettings.smtp.auth,
      });

      // Reset the mock to test caching
      jest.clearAllMocks();
      
      // Second call should use cached transporter
      await service.getTenantTransporter(tenantId);
      
      expect(tenantsService.getTenantSettings).not.toHaveBeenCalled();
      expect(nodemailer.createTransport).not.toHaveBeenCalled();
    });

    it('should return default transporter if tenant has no email settings', async () => {
      const tenantId = 'tenant-no-settings';
      
      mockTenantsService.getTenantSettings.mockResolvedValue({});

      const transporter = await service.getTenantTransporter(tenantId);
      
      expect(tenantsService.getTenantSettings).toHaveBeenCalledWith(tenantId);
      // Should return the default transporter (from constructor)
      expect(transporter).toBe(mockTransporter);
    });
  });

  describe('sendEmail', () => {
    it('should send an email using the default transporter', async () => {
      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        text: 'Test content',
      };
      const tenantId = null;

      await service.sendEmail(emailData, tenantId);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com', // Default from address from config
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      });
    });

    it('should send an email using a tenant-specific transporter', async () => {
      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        text: 'Test content',
      };
      const tenantId = 'tenant-123';
      const tenantEmailSettings = {
        provider: 'smtp',
        from: 'tenant@example.com',
        smtp: {
          host: 'tenant-smtp.example.com',
          port: 465,
          secure: true,
          auth: {
            user: 'tenant-user',
            pass: 'tenant-pass',
          },
        },
      };

      mockTenantsService.getTenantSettings.mockResolvedValue({
        email: tenantEmailSettings,
      });

      // Create a new mock transporter for the tenant
      const tenantTransporter = {
        sendMail: jest.fn().mockResolvedValue({
          messageId: 'tenant-message-id',
          envelope: {},
          accepted: [emailData.to],
          rejected: [],
          pending: [],
          response: 'OK',
        }),
        verify: jest.fn().mockResolvedValue(true),
      };
      
      // Make createTransport return our tenant-specific transporter
      (nodemailer.createTransport as jest.Mock).mockReturnValue(tenantTransporter);

      await service.sendEmail(emailData, tenantId);

      expect(mockTenantsService.getTenantSettings).toHaveBeenCalledWith(tenantId);
      expect(tenantTransporter.sendMail).toHaveBeenCalledWith({
        from: tenantEmailSettings.from,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      });
    });

    it('should handle emails with attachments', async () => {
      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test with Attachment',
        html: '<p>Test with attachment</p>',
        text: 'Test with attachment',
        attachments: [
          {
            filename: 'test.pdf',
            content: Buffer.from('test content'),
            contentType: 'application/pdf',
          },
        ],
      };
      const tenantId = null;

      await service.sendEmail(emailData, tenantId);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        attachments: emailData.attachments,
      });
    });

    it('should handle errors when sending emails', async () => {
      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        text: 'Test content',
      };
      const tenantId = null;

      const error = new Error('SMTP error');
      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(service.sendEmail(emailData, tenantId)).rejects.toThrow();
    });
  });

  describe('verifyConnection', () => {
    it('should verify connection to the default email server', async () => {
      await service.verifyConnection();
      
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should verify connection to a tenant-specific email server', async () => {
      const tenantId = 'tenant-123';
      const tenantEmailSettings = {
        provider: 'smtp',
        smtp: {
          host: 'tenant-smtp.example.com',
          port: 465,
          secure: true,
          auth: {
            user: 'tenant-user',
            pass: 'tenant-pass',
          },
        },
      };

      mockTenantsService.getTenantSettings.mockResolvedValue({
        email: tenantEmailSettings,
      });

      // Create a new mock transporter for the tenant
      const tenantTransporter = {
        sendMail: jest.fn(),
        verify: jest.fn().mockResolvedValue(true),
      };
      
      // Make createTransport return our tenant-specific transporter
      (nodemailer.createTransport as jest.Mock).mockReturnValue(tenantTransporter);

      await service.verifyConnection(tenantId);

      expect(mockTenantsService.getTenantSettings).toHaveBeenCalledWith(tenantId);
      expect(tenantTransporter.verify).toHaveBeenCalled();
    });

    it('should handle failed connections', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

      await expect(service.verifyConnection()).rejects.toThrow('Connection failed');
    });
  });
});
