import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TenantsService } from '../../tenants/tenants.service';
import * as firebase from 'firebase-admin';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private defaultFirebaseApp: firebase.app.App;
  private tenantFirebaseApps: Map<string, firebase.app.App> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly tenantsService: TenantsService,
  ) {
    // Initialize default Firebase app
    this.initDefaultFirebaseApp();
  }

  private initDefaultFirebaseApp(): void {
    try {
      const pushConfig = this.configService.get('push');
      
      if (pushConfig.provider === 'firebase') {
        this.defaultFirebaseApp = firebase.initializeApp({
          credential: firebase.credential.cert(pushConfig.firebase.serviceAccount),
        }, 'default');
        
        this.logger.log('Default Firebase app initialized successfully');
      } else {
        this.logger.warn(`Unsupported push provider: ${pushConfig.provider}`);
      }
    } catch (error) {
      this.logger.error(`Failed to initialize Firebase app: ${error.message}`, error.stack);
    }
  }

  private async getFirebaseAppForTenant(tenantId: string): Promise<firebase.app.App> {
    // Check if we already have a Firebase app for this tenant
    if (this.tenantFirebaseApps.has(tenantId)) {
      return this.tenantFirebaseApps.get(tenantId);
    }
    
    try {
      // Get tenant-specific push settings
      const tenantSettings = await this.tenantsService.getNotificationSettings(tenantId);
      
      if (!tenantSettings.pushProvider || tenantSettings.pushProvider !== 'firebase' || !tenantSettings.firebaseServiceAccount) {
        return this.defaultFirebaseApp;
      }
      
      // Create tenant-specific Firebase app
      const app = firebase.initializeApp({
        credential: firebase.credential.cert(JSON.parse(tenantSettings.firebaseServiceAccount)),
      }, `tenant-${tenantId}`);
      
      // Cache and return the app
      this.tenantFirebaseApps.set(tenantId, app);
      return app;
    } catch (error) {
      this.logger.error(`Error getting Firebase app for tenant ${tenantId}: ${error.message}`);
      return this.defaultFirebaseApp;
    }
  }

  async send(options: {
    deviceToken: string;
    title: string;
    body: string;
    data?: Record<string, string>;
    tenantId: string;
    metadata?: any;
  }): Promise<any> {
    const { deviceToken, title, body, data, tenantId, metadata } = options;
    
    try {
      // Get appropriate Firebase app
      const app = await this.getFirebaseAppForTenant(tenantId);
      
      if (!app) {
        throw new Error('Firebase app not initialized');
      }
      
      // Prepare message
      const message: firebase.messaging.Message = {
        token: deviceToken,
        notification: {
          title,
          body,
        },
        data: data || {},
      };
      
      // Send message
      const response = await app.messaging().send(message);
      
      this.logger.log(`Push notification sent to device ${deviceToken} (Message ID: ${response})`);
      return {
        success: true,
        messageId: response,
      };
    } catch (error) {
      this.logger.error(`Failed to send push notification to device ${deviceToken}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendMulticast(options: {
    deviceTokens: string[];
    title: string;
    body: string;
    data?: Record<string, string>;
    tenantId: string;
    metadata?: any;
  }): Promise<any> {
    const { deviceTokens, title, body, data, tenantId, metadata } = options;
    
    try {
      // Get appropriate Firebase app
      const app = await this.getFirebaseAppForTenant(tenantId);
      
      if (!app) {
        throw new Error('Firebase app not initialized');
      }
      
      // Prepare message
      const message: firebase.messaging.MulticastMessage = {
        tokens: deviceTokens,
        notification: {
          title,
          body,
        },
        data: data || {},
      };
      
      // Send multicast message
      const response = await app.messaging().sendMulticast(message);
      
      this.logger.log(`Multicast push notification sent to ${response.successCount}/${deviceTokens.length} devices`);
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses,
      };
    } catch (error) {
      this.logger.error(`Failed to send multicast push notification: ${error.message}`, error.stack);
      throw error;
    }
  }
}
