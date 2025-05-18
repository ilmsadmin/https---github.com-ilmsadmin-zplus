import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TenantsService } from '../../tenants/tenants.service';
import * as nodemailer from 'nodemailer';
import * as nodemailerSendgrid from 'nodemailer-sendgrid';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private defaultTransporter: nodemailer.Transporter;
  private tenantTransporters: Map<string, nodemailer.Transporter> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly tenantsService: TenantsService,
  ) {
    // Initialize default email transporter
    this.initDefaultTransporter();
  }

  private initDefaultTransporter(): void {
    const emailConfig = this.configService.get('email');
    
    if (emailConfig.provider === 'sendgrid') {
      this.defaultTransporter = nodemailer.createTransport(
        nodemailerSendgrid({
          apiKey: emailConfig.sendgrid.apiKey,
        })
      );
    } else if (emailConfig.provider === 'smtp') {
      this.defaultTransporter = nodemailer.createTransport({
        host: emailConfig.smtp.host,
        port: emailConfig.smtp.port,
        secure: emailConfig.smtp.secure,
        auth: {
          user: emailConfig.smtp.user,
          pass: emailConfig.smtp.password,
        },
      });
    } else {
      // For local development or testing, use ethereal.email
      this.defaultTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: emailConfig.ethereal?.user || 'ethereal.user@ethereal.email',
          pass: emailConfig.ethereal?.password || 'etherealpass',
        },
      });
    }
  }

  private async getTransporterForTenant(tenantId: string): Promise<nodemailer.Transporter> {
    // Check if we already have a transporter for this tenant
    if (this.tenantTransporters.has(tenantId)) {
      return this.tenantTransporters.get(tenantId);
    }
    
    try {
      // Get tenant-specific email settings
      const tenantSettings = await this.tenantsService.getNotificationSettings(tenantId);
      
      if (!tenantSettings.emailProvider) {
        return this.defaultTransporter;
      }
      
      // Create tenant-specific transporter based on settings
      let transporter: nodemailer.Transporter;
      
      if (tenantSettings.emailProvider === 'sendgrid') {
        transporter = nodemailer.createTransport(
          nodemailerSendgrid({
            apiKey: tenantSettings.sendgridApiKey,
          })
        );
      } else if (tenantSettings.emailProvider === 'smtp') {
        transporter = nodemailer.createTransport({
          host: tenantSettings.smtpHost,
          port: tenantSettings.smtpPort,
          secure: tenantSettings.smtpSecure,
          auth: {
            user: tenantSettings.smtpUser,
            pass: tenantSettings.smtpPassword,
          },
        });
      } else {
        return this.defaultTransporter;
      }
      
      // Cache and return the transporter
      this.tenantTransporters.set(tenantId, transporter);
      return transporter;
    } catch (error) {
      this.logger.error(`Error getting email transporter for tenant ${tenantId}: ${error.message}`);
      return this.defaultTransporter;
    }
  }

  async send(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
    tenantId: string;
    metadata?: any;
  }): Promise<any> {
    const { to, subject, text, html, from, tenantId, metadata } = options;
    
    try {
      // Get appropriate transporter
      const transporter = await this.getTransporterForTenant(tenantId);
      
      // Get tenant settings for default sender information
      const tenantSettings = await this.tenantsService.getNotificationSettings(tenantId);
      const defaultSender = tenantSettings.defaultSender || this.configService.get('email.defaultSender');
      
      // Prepare email options
      const mailOptions = {
        from: from || defaultSender,
        to,
        subject,
        text,
        html,
      };
      
      // Send email
      const result = await transporter.sendMail(mailOptions);
      
      this.logger.log(`Email sent to ${to} with subject "${subject}" (Message ID: ${result.messageId})`);
      return {
        success: true,
        messageId: result.messageId,
        metadata: result,
      };
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
