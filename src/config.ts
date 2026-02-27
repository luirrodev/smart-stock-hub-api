import { registerAs } from '@nestjs/config';

export default registerAs('config', () => {
  return {
    database: {
      url: process.env.DATABASE_URL,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379/0',
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      username: process.env.REDIS_USERNAME,
      tls: process.env.REDIS_TLS === 'true',
      db: parseInt(process.env.REDIS_DB || '0', 10),
    },
    jwt: {
      accessTokenSecret: process.env.JWT_ACCESS_SECRET,
      refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
      accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
      refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
      paypalSignToken: process.env.PAYPAL_SIGN_TOKEN,
    },
    mandasaldoAPI: {
      url: process.env.API_URL_GET_PRODUCTS,
      api_key: process.env.API_KEY_GET_PRODUCTS,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    },
    storage: {
      minio: {
        endpoint: process.env.MINIO_ENDPOINT,
        port: parseInt(process.env.MINIO_PORT || '9000', 10),
        useSSL: process.env.MINIO_USE_SSL === 'true',
        rootUser: process.env.MINIO_ROOT_USER as string,
        rootPassword: process.env.MINIO_ROOT_PASSWORD as string,
        bucketName: process.env.MINIO_BUCKET_NAME as string,
        publicUrl: process.env.MINIO_PUBLIC_URL as string,
      },
      upload: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'application/pdf',
        ],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'],
      },
      signedUrl: {
        defaultExpiresIn: 900, // 15 minutos
      },
    },
    logs: {
      level: process.env.LOG_LEVEL || 'log',
      retentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '90', 10),
      batchSize: parseInt(process.env.LOG_BATCH_SIZE || '100', 10),
      batchTimeoutMs: parseInt(process.env.LOG_BATCH_TIMEOUT_MS || '5000', 10),
      bullQueueName: process.env.BULL_QUEUE_NAME || 'logs',
      bullMaxWorkers: parseInt(process.env.BULL_MAX_WORKERS || '4', 10),
    },
  };
});
