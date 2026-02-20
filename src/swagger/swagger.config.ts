import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

/**
 * Setup Swagger documentation for multiple API versions
 * Creates and configures both v1 and v2 with proper endpoint filtering
 *
 * Version 1: http://localhost:3000/docs/v1
 *   - Basic endpoints (checkout, success)
 *
 * Version 2: http://localhost:3000/docs/v2
 *   - Full API documentation with all endpoints
 *
 * @param app NestJS application instance
 */
export function setupSwaggerDocumentation(app: INestApplication): void {
  // ============================================
  // V1: Minimal API
  // ============================================
  const configV1 = new DocumentBuilder()
    .setTitle('Smart Store API - v1')
    .setDescription(
      'REST API built with NestJS framework. Version 1 includes basic checkout and payment success endpoints.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const documentV1 = SwaggerModule.createDocument(app, configV1);

  // Filter to only show v1 endpoints
  const v1Paths = {};
  Object.keys(documentV1.paths).forEach((path) => {
    if (path.includes('/api/v1/')) {
      v1Paths[path] = documentV1.paths[path];
    }
  });
  documentV1.paths = v1Paths;

  SwaggerModule.setup('docs/v1', app, documentV1);

  // ============================================
  // V2: Full API (All Endpoints)
  // ============================================
  const configV2 = new DocumentBuilder()
    .setTitle('Smart Store API - v2')
    .setDescription(
      'REST API built with NestJS framework. Version 2 includes all endpoints with extended features.',
    )
    .setVersion('2.0')
    .addBearerAuth()
    .build();

  const documentV2 = SwaggerModule.createDocument(app, configV2);

  // Filter to only show v2 endpoints
  const v2Paths = {};
  Object.keys(documentV2.paths).forEach((path) => {
    if (path.includes('/api/v2/')) {
      v2Paths[path] = documentV2.paths[path];
    }
  });
  documentV2.paths = v2Paths;

  SwaggerModule.setup('docs/v2', app, documentV2);
}
