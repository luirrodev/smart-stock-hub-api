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

/**
 * Extract all referenced schema names from the endpoints and other schemas
 */
function getReferencedSchemas(doc: any): Set<string> {
  const referenced = new Set<string>();

  const extractReferences = (obj: any) => {
    if (!obj) return;
    if (typeof obj === 'string') {
      const match = obj.match(/#\/components\/schemas\/(\w+)/);
      if (match) referenced.add(match[1]);
    } else if (typeof obj === 'object') {
      Object.values(obj).forEach((value: any) => extractReferences(value));
    }
  };

  // Extract from all paths
  Object.values(doc.paths || {}).forEach((path: any) => {
    extractReferences(path);
  });

  // Also extract from schema definitions that are already referenced
  // This handles nested references (e.g., ProductListDto inside ProductPaginatedResponse)
  const addSchemaReferences = (schemaName: string, visited = new Set<string>()) => {
    if (visited.has(schemaName) || !doc.components?.schemas?.[schemaName]) {
      return;
    }
    visited.add(schemaName);

    const schema = doc.components.schemas[schemaName];
    extractReferences(schema);

    // Recursively check newly added references
    Array.from(referenced).forEach((ref) => {
      if (!visited.has(ref)) {
        addSchemaReferences(ref, visited);
      }
    });
  };

  // Start recursive extraction from all referenced schemas
  const initiallyReferenced = Array.from(referenced);
  initiallyReferenced.forEach((schema) => {
    addSchemaReferences(schema);
  });

  return referenced;
}

/**
 * Remove unused schemas from document
 */
function cleanUnusedSchemas(doc: any): void {
  if (!doc.components?.schemas) return;

  const referenced = getReferencedSchemas(doc);
  const allSchemas = Object.keys(doc.components.schemas);

  allSchemas.forEach((schema) => {
    if (!referenced.has(schema)) {
      delete doc.components.schemas[schema];
    }
  });
}

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

  // Clean unused DTOs/schemas from v1
  cleanUnusedSchemas(documentV1);

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

  // Clean unused DTOs/schemas from v2
  cleanUnusedSchemas(documentV2);

  SwaggerModule.setup('docs/v2', app, documentV2);
}
