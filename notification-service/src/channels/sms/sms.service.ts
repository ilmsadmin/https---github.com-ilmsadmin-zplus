import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TenantsService } from '../../tenants/tenants.service';
import * as Twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private defaultTwilioClient: Twilio.Twilio;
  private tenantTwilioClients: Map<string, Twilio.Twilio> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly tenantsService: TenantsService,
  ) {
    // Initialize default Twilio client
    this.initDefaultTwilioClient();
  }

  private initDefaultTwilioClient(): void {
    try {
      const smsConfig = this.configService.get('sms');
      
      if (smsConfig.provider === 'twilio') {
        this.defaultTwilioClient = Twilio(smsConfig.twilio.accountSid, smsConfig.twilio.authToken);
        this.logger.log('Default Twilio client initialized successfully');
      } else {
        this.logger.warn(`Unsupported SMS provider: ${smsConfig.provider}`);
      }
    } catch (error) {
      this.logger.error(`Failed to initialize Twilio client: ${error.message}`, error.stack);
    }
  }

  private async getTwilioClientForTenant(tenantId: string): Promise<Twilio.Twilio> {
    // Check if we already have a Twilio client for this tenant
    if (this.tenantTwilioClients.has(tenantId)) {
      return this.tenantTwilioClients.get(tenantId);
    }
    
    try {
      // Get tenant-specific SMS settings
      const tenantSettings = await this.tenantsService.getNotificationSettings(tenantId);
      
      if (!tenantSettings.smsProvider || tenantSettings.smsProvider !== 'twilio' || 
          !tenantSettings.twilioAccountSid || !tenantSettings.twilioAuthToken) {
        return this.defaultTwilioClient;
      }
      
      // Create tenant-specific Twilio client
      const client = Twilio(tenantSettings.twilioAccountSid, tenantSettings.twilioAuthToken);
      
      // Cache and return the client
      this.tenantTwilioClients.set(tenantId, client);
      return client;
    } catch (error) {
      this.logger.error(`Error getting Twilio client for tenant ${tenantId}: ${error.message}`);
      return this.defaultTwilioClient;
    }
  }

  async send(options: {
    to: string;
    body: string;
    from?: string;
    tenantId: string;
    metadata?: any;
  }): Promise<any> {
    const { to, body, from, tenantId, metadata } = options;
    
    try {
      // Get appropriate Twilio client
      const client = await this.getTwilioClientForTenant(tenantId);
      
      if (!client) {
        throw new Error('Twilio client not initialized');
      }
      
      // Get tenant settings for default sender information
      const tenantSettings = await this.tenantsService.getNotificationSettings(tenantId);
      const defaultSender = tenantSettings.defaultSmsFrom || this.configService.get('sms.defaultFrom');
      
      // Send SMS
      const message = await client.messages.create({
        body,
        to,
        from: from || defaultSender,
      });
      
      this.logger.log(`SMS sent to ${to} (Message SID: ${message.sid})`);
      return {
        success: true,
        messageSid: message.sid,
        metadata: {
          status: message.status,
          dateCreated: message.dateCreated,
          dateUpdated: message.dateUpdated,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
