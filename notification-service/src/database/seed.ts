import * as fs from 'fs';
import * as path from 'path';
import { dataSource } from '../config/typeorm.config';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Template } from '../templates/entities/template.entity';
import { NotificationChannel } from '../notifications/enums/notification-channel.enum';

async function seed() {
  // Initialize the connection
  await dataSource.initialize();
  console.log('Database connection initialized');

  try {
    // Seed default tenant
    const defaultTenant = dataSource.getRepository(Tenant).create({
      code: 'default',
      name: 'Default Tenant',
      isActive: true,
      settings: {
        emailProvider: 'smtp',
        throttling: {
          enabled: true,
          rate: 100,
          period: '1m',
        },
        retryConfig: {
          maxAttempts: 3,
          intervalMs: 60000,
        },
      },
    });
    
    const savedTenant = await dataSource.getRepository(Tenant).save(defaultTenant);
    console.log(`Created default tenant with ID: ${savedTenant.id}`);

    // Seed email templates
    const welcomeTemplate = dataSource.getRepository(Template).create({
      tenantId: savedTenant.id,
      code: 'welcome-email',
      name: 'Welcome Email',
      description: 'Email sent to new users when they register',
      supportedChannels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      emailSubject: 'Welcome to {{platformName}}, {{userName}}!',
      emailHtmlContent: `
        <div>
          <h1>Welcome to {{platformName}}, {{userName}}!</h1>
          <p>Thank you for registering with us.</p>
          <p>Please click the link below to verify your email address:</p>
          <p><a href="{{activationLink}}">Verify Email</a></p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        </div>
      `,
      emailTextContent: 'Welcome to {{platformName}}, {{userName}}! Thank you for registering with us. Please visit {{activationLink}} to verify your email address.',
      inAppTitle: 'Welcome to {{platformName}}',
      inAppContent: 'Thank you for registering with us, {{userName}}!',
      defaultVariables: {
        platformName: 'Multi-Tenant Platform',
      },
      isActive: true,
    });
    
    await dataSource.getRepository(Template).save(welcomeTemplate);
    console.log('Created welcome email template');

    const passwordResetTemplate = dataSource.getRepository(Template).create({
      tenantId: savedTenant.id,
      code: 'password-reset',
      name: 'Password Reset',
      description: 'Email sent when a user requests a password reset',
      supportedChannels: [NotificationChannel.EMAIL],
      emailSubject: 'Password Reset Request',
      emailHtmlContent: `
        <div>
          <h1>Password Reset Request</h1>
          <p>Hello {{userName}},</p>
          <p>We received a request to reset your password. Click the link below to set a new password:</p>
          <p><a href="{{resetLink}}">Reset Password</a></p>
          <p>This link will expire in {{expirationTime}} hours.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      `,
      emailTextContent: 'Hello {{userName}}, We received a request to reset your password. Visit {{resetLink}} to set a new password. This link will expire in {{expirationTime}} hours.',
      defaultVariables: {
        expirationTime: '24',
      },
      isActive: true,
    });
    
    await dataSource.getRepository(Template).save(passwordResetTemplate);
    console.log('Created password reset template');

    const orderConfirmationTemplate = dataSource.getRepository(Template).create({
      tenantId: savedTenant.id,
      code: 'order-confirmation',
      name: 'Order Confirmation',
      description: 'Notification sent when a user places an order',
      supportedChannels: [NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.IN_APP],
      emailSubject: 'Order Confirmation #{{orderNumber}}',
      emailHtmlContent: `
        <div>
          <h1>Order Confirmation</h1>
          <p>Hello {{userName}},</p>
          <p>Thank you for your order!</p>
          <p>Order Number: {{orderNumber}}</p>
          <p>Order Date: {{orderDate}}</p>
          <p>Total: {{orderTotal}}</p>
          <p>Shipping Address: {{shippingAddress}}</p>
          <h2>Order Items:</h2>
          <ul>
            {{#each orderItems}}
              <li>{{this.name}} - {{this.quantity}} x {{this.price}}</li>
            {{/each}}
          </ul>
        </div>
      `,
      emailTextContent: 'Hello {{userName}}, Thank you for your order! Order Number: {{orderNumber}}, Order Date: {{orderDate}}, Total: {{orderTotal}}',
      smsContent: 'Your order #{{orderNumber}} has been confirmed. Total: {{orderTotal}}',
      inAppTitle: 'Order #{{orderNumber}} Confirmed',
      inAppContent: 'Thank you for your order! Order total: {{orderTotal}}',
      isActive: true,
    });
    
    await dataSource.getRepository(Template).save(orderConfirmationTemplate);
    console.log('Created order confirmation template');

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the connection
    await dataSource.destroy();
    console.log('Database connection closed');
  }
}

// Run the seed function
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error running seed:', error);
    process.exit(1);
  });
