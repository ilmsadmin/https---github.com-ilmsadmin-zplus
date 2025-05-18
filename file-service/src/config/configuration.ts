export default () => ({
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  
  // Database configuration
  database: {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_DATABASE || 'system_db',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
    ssl: process.env.DB_SSL === 'true',
  },
  
  // Redis configuration for caching
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    ttl: parseInt(process.env.REDIS_TTL, 10) || 60 * 60, // 1 hour
  },
  
  // RabbitMQ configuration for event-driven communication
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    exchangeName: process.env.RABBITMQ_EXCHANGE || 'multi-tenant-exchange',
    queueName: process.env.RABBITMQ_QUEUE || 'file-service-queue',
  },
  
  // MinIO/S3 configuration
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'minio', // 'minio' or 's3'
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT, 10) || 9000,
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    region: process.env.MINIO_REGION || 'us-east-1',
    useSsl: process.env.MINIO_USE_SSL === 'true',
    bucketPrefix: process.env.BUCKET_PREFIX || 'tenant-',
  },
  
  // File configuration
  file: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 104857600, // 100MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,application/zip').split(','),
    enableVirusScan: process.env.ENABLE_VIRUS_SCAN === 'true',
    tempDir: process.env.TEMP_DIR || '/tmp/file-uploads',
    expirationTime: parseInt(process.env.FILE_EXPIRATION_TIME, 10) || 3600, // 1 hour
  },
  
  // Rate limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  
  // Security configuration
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || 'your-encryption-key',
  },
});
