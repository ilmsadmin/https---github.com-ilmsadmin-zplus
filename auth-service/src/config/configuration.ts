import * as Joi from 'joi';

export interface EnvironmentVariables {
  NODE_ENV: string;
  PORT: number;
  
  // Database
  SYSTEM_DB_HOST: string;
  SYSTEM_DB_PORT: number;
  SYSTEM_DB_USERNAME: string;
  SYSTEM_DB_PASSWORD: string;
  SYSTEM_DB_NAME: string;
  
  // JWT
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_EXPIRATION: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRATION: string;
  
  // Redis
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  
  // Rate Limiting
  THROTTLE_TTL: number;
  THROTTLE_LIMIT: number;
  
  // OAuth
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
  
  FACEBOOK_CLIENT_ID: string;
  FACEBOOK_CLIENT_SECRET: string;
  FACEBOOK_CALLBACK_URL: string;
  
  MICROSOFT_CLIENT_ID: string;
  MICROSOFT_CLIENT_SECRET: string;
  MICROSOFT_CALLBACK_URL: string;
  
  // Application URLs
  APP_URL: string;
  LOGIN_SUCCESS_REDIRECT: string;
  LOGIN_FAILURE_REDIRECT: string;
}

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  
  // Database
  SYSTEM_DB_HOST: Joi.string().required(),
  SYSTEM_DB_PORT: Joi.number().default(5432),
  SYSTEM_DB_USERNAME: Joi.string().required(),
  SYSTEM_DB_PASSWORD: Joi.string().required(),
  SYSTEM_DB_NAME: Joi.string().required(),
  
  // JWT
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
  
  // Redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  
  // Rate Limiting
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(10),
  
  // OAuth
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  GOOGLE_CALLBACK_URL: Joi.string().optional(),
  
  FACEBOOK_CLIENT_ID: Joi.string().optional(),
  FACEBOOK_CLIENT_SECRET: Joi.string().optional(),
  FACEBOOK_CALLBACK_URL: Joi.string().optional(),
  
  MICROSOFT_CLIENT_ID: Joi.string().optional(),
  MICROSOFT_CLIENT_SECRET: Joi.string().optional(),
  MICROSOFT_CALLBACK_URL: Joi.string().optional(),
  
  // Application URLs
  APP_URL: Joi.string().required(),
  LOGIN_SUCCESS_REDIRECT: Joi.string().required(),
  LOGIN_FAILURE_REDIRECT: Joi.string().required(),
});

export default () => ({
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10) || 3000,
  
  database: {
    system: {
      host: process.env.SYSTEM_DB_HOST,
      port: parseInt(process.env.SYSTEM_DB_PORT, 10) || 5432,
      username: process.env.SYSTEM_DB_USERNAME,
      password: process.env.SYSTEM_DB_PASSWORD,
      database: process.env.SYSTEM_DB_NAME,
    },
  },
  
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
  },
  
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 10,
  },
  
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackUrl: process.env.FACEBOOK_CALLBACK_URL,
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackUrl: process.env.MICROSOFT_CALLBACK_URL,
    },
  },
  
  app: {
    url: process.env.APP_URL,
    loginSuccessRedirect: process.env.LOGIN_SUCCESS_REDIRECT,
    loginFailureRedirect: process.env.LOGIN_FAILURE_REDIRECT,
  },
});
