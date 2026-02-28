import { INestApplication } from '@nestjs/common';
import { Express } from 'express';

/**
 * Setup BasicAuth protection for Swagger documentation routes
 * Protects /docs/* endpoints with username/password from environment variables
 *
 * Environment Variables:
 * - SWAGGER_USER: Username for BasicAuth (default: 'admin')
 * - SWAGGER_PASSWORD: Password for BasicAuth (default: 'admin')
 *
 * @param app NestJS application instance
 */
export function setupSwaggerBasicAuth(app: INestApplication<any>): void {
  const swaggerUser = process.env.SWAGGER_USER || 'admin';
  const swaggerPassword = process.env.SWAGGER_PASSWORD || 'admin';

  app.use('/docs/v2', (req, res, next) => {
    const auth = req.headers.authorization;

    // Check if Authorization header exists and starts with 'Basic'
    if (!auth || !auth.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Swagger Documentation"');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Decode Base64 credentials
    const credentials = Buffer.from(auth.slice(6), 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    // Validate credentials
    if (username === swaggerUser && password === swaggerPassword) {
      return next();
    }

    // Invalid credentials
    res.setHeader('WWW-Authenticate', 'Basic realm="Swagger Documentation"');
    return res.status(401).json({ message: 'Unauthorized' });
  });
}
