import { registerAs } from '@nestjs/config';

export default registerAs('config', () => {
  return {
    database: {
      url: process.env.DATABASE_URL,
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    },
    jwt: {
      accessTokenSecret: process.env.JWT_ACCESS_SECRET,
      refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
      accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
      refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    },
    mandasaldoAPI: {
      url: process.env.API_URL_GET_PRODUCTS,
      api_key: process.env.API_KEY_GET_PRODUCTS,
    },
  };
});
