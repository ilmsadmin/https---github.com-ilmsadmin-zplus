import { registerAs } from '@nestjs/config';

export default registerAs('push', () => ({
  firebase: {
    enabled: process.env.FIREBASE_ENABLED === 'true',
    credentialsFile: process.env.FIREBASE_CREDENTIALS_FILE || './firebase-credentials.json',
  },
  apn: {
    enabled: process.env.APN_ENABLED === 'true',
    keyId: process.env.APN_KEY_ID || '',
    teamId: process.env.APN_TEAM_ID || '',
    keyFile: process.env.APN_KEY_FILE || '',
    production: process.env.APN_PRODUCTION === 'true',
  },
  throttle: {
    maxPerMinute: parseInt(process.env.PUSH_MAX_PER_MINUTE || '100', 10),
    maxPerHour: parseInt(process.env.PUSH_MAX_PER_HOUR || '1000', 10),
  },
}));
