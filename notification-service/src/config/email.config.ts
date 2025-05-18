import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  provider: process.env.EMAIL_PROVIDER || 'smtp',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || '',
    },
  },
  from: {
    address: process.env.EMAIL_FROM_ADDRESS || 'noreply@example.com',
    name: process.env.EMAIL_FROM_NAME || 'Multi-Tenant Platform',
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
  },
  mailchimp: {
    apiKey: process.env.MAILCHIMP_API_KEY || '',
    server: process.env.MAILCHIMP_SERVER || '',
  },
  throttle: {
    maxPerMinute: parseInt(process.env.EMAIL_MAX_PER_MINUTE || '100', 10),
    maxPerHour: parseInt(process.env.EMAIL_MAX_PER_HOUR || '1000', 10),
  },
}));
