import { NestFactory, Reflector } from '@nestjs/core';
import {
  ValidationPipe,
  ClassSerializerInterceptor,
  VersioningType,
} from '@nestjs/common';
import { AppModule } from './app.module';
import { setupSwaggerDocumentation, setupSwaggerBasicAuth } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe configuration
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Enable API versioning using URI prefix (e.g., /api/v1/payments)
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'api/v',
  });

  // Setup Swagger documentation (v1 and v2)
  setupSwaggerBasicAuth(app);
  setupSwaggerDocumentation(app);

  // Enable CORS for cross-origin requests
  app.enableCors();

  // Get port from environment variables or use default
  const port = process.env.PORT || 3000;

  // Start the server
  await app.listen(port);
}

bootstrap();
