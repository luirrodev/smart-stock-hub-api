import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

/**
 * Setup Swagger documentation for multiple API versions
 * Creates and configures both v1 (minimized - carts only) and v2 (all endpoints)
 *
 * Version 1: http://localhost:3000/docs/v1
 *   - Carrito API focused
 *   - Excludes: users, roles, permissions, stores, inventory/components
 *
 * Version 2: http://localhost:3000/docs/v2
 *   - Full API documentation with all endpoints
 *
 * @param app NestJS application instance
 */
export function setupSwaggerDocumentation(app: INestApplication): void {
  // ============================================
  // V1: Carrito API (Minimized)
  // ============================================
  const configV1 = new DocumentBuilder()
    .setTitle('NestJS First API - v1')
    .setDescription(
      'REST API built with NestJS framework, TypeORM for database integration, and comprehensive API documentation',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const documentV1 = SwaggerModule.createDocument(app, configV1);

  // Exclude specific controllers from v1 documentation
  const excludedPaths = [
    '/users',
    '/roles',
    '/permissions',
    '/stores',
    '/inventory/components',
  ];

  Object.keys(documentV1.paths).forEach((path) => {
    if (excludedPaths.some((excluded) => path.startsWith(excluded))) {
      delete documentV1.paths[path];
    }
  });

  SwaggerModule.setup('docs/v1', app, documentV1);

  // ============================================
  // V2: Full API (All Endpoints)
  // ============================================
  const configV2 = new DocumentBuilder()
    .setTitle('NestJS First API - v2')
    .setDescription(
      'REST API built with NestJS framework, TypeORM for database integration, and comprehensive API documentation (All endpoints)',
    )
    .setVersion('2.0')
    .addBearerAuth()
    .build();

  const documentV2 = SwaggerModule.createDocument(app, configV2);
  SwaggerModule.setup('docs/v2', app, documentV2);
}
