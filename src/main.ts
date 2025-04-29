import { NestFactory, Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe configuration
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Class serializer interceptor
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Swagger API documentation setup
  const config = new DocumentBuilder()
    .setTitle('NestJS First API')
    .setDescription(
      'REST API built with NestJS framework, TypeORM for database integration, and comprehensive API documentation',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Enable CORS for cross-origin requests
  app.enableCors();

  // Get port from environment variables or use default
  const port = process.env.PORT || 3000;

  // Start the server
  await app.listen(port);
  console.log(`Server on port ${port}`);
}

bootstrap();
