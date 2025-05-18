import { registerAs } from '@nestjs/config';

export default registerAs('payments', () => ({
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    apiVersion: process.env.STRIPE_API_VERSION || '2023-10-16',
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox',
  },
  dunning: {
    retryDays: process.env.PAYMENT_RETRY_DAYS?.split(',').map(Number) || [3, 7, 14],
    gracePeriodinDays: parseInt(process.env.PAYMENT_GRACE_PERIOD_DAYS || '3', 10),
  },
  notifications: {
    invoiceReminder: parseInt(process.env.INVOICE_REMINDER_DAYS || '3', 10),
    invoiceOverdue: parseInt(process.env.INVOICE_OVERDUE_DAYS || '1', 10),
  },
}));
