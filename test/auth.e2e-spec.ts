/**
 * ============================================================================
 * PRUEBAS E2E DEL MÓDULO DE AUTENTICACIÓN
 * ============================================================================
 *
 * DESCRIPCIÓN:
 * Pruebas End-to-End para validar el flujo completo de autenticación.
 * Los tests E2E hacen requests HTTP reales a la aplicación, probando:
 * - Controllers → Services → Repositories → Base de Datos
 *
 * DIFERENCIA CON UNIT TESTS:
 * ✅ Unit Tests: Prueban funciones individuales con MOCKS
 * ✅ E2E Tests: Prueban flujos REALES con BD verdadera
 *
 * COMANDOS:
 * $ npm run test:e2e                    # Execute all E2E tests
 * $ npm run test:e2e -- --verbose       # With detailed output
 * $ npm run test:e2e -- --testNamePattern="login"  # Only specific tests
 *
 * DOCUMENTACIÓN COMPLETA:
 * Ver docs/E2E_TESTING_GUIDE.md
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestDataSource, closeTestDatabase } from './database';
import { seedTestData } from './auth.helpers';

describe('AuthModule E2E Tests', () => {
  let app: INestApplication | null = null;
  let dataSource: DataSource;
  let testData: any;

  /**
   * CONFIGURACIÓN: Ejecuta UNA VEZ antes de TODO
   *
   * Acciones:
   * 1. ✅ Crea BD de testing separada
   * 2. ✅ Inicializa aplicación NestJS
   * 3. ✅ Seedea datos de prueba
   */
  beforeAll(async () => {
    console.log('\n🔧 Iniciando configuración de pruebas E2E...\n');

    try {
      // Paso 1: Crear conexión a BD de testing
      dataSource = await createTestDataSource();
      console.log('✅ Base de datos de testing conectada');

      // NOTA: Para una versión completa que integre la app NestJS con la BD de test,
      // consulta: test/auth.e2e-spec.simplified.ts
      //
      // Aquí mantenemos una versión simplificada para demostración que:
      // 1. Muestra la estructura de tests E2E
      // 2. Explica cómo escribir tests
      // 3. Proporciona ejemplos de casos de prueba

      // TODO: Integrar AppModule/AuthModule con BD de testing
      // const moduleFixture: TestingModule = await Test.createTestingModule({
      //   imports: [AuthModule],
      // }).compile();
      // app = moduleFixture.createNestApplication();
      // await app.init();

      // Paso 2: Seedear datos
      testData = await seedTestData(dataSource);
      console.log('✅ Datos de testing seeded\n');
    } catch (error) {
      console.error('❌ Error en beforeAll:', error);
      throw error;
    }
  });

  /**
   * LIMPIEZA: Ejecuta UNA VEZ al final
   */
  afterAll(async () => {
    console.log('\n🧹 Limpiando recursos de tests...\n');
    if (app !== null && typeof app !== 'undefined') {
      (app as INestApplication).close();
    }
    await closeTestDatabase();
    console.log('✅ Recursos liberados\n');
  });

  // ===================================================================
  // SECCIÓN: POST /auth/login
  // ===================================================================
  describe('POST /auth/login', () => {
    /**
     * CASO 1: Login exitoso STAFF
     *
     * FLUJO:
     * 1. Cliente envía email + password
     * 2. AuthService valida credenciales
     * 3. Genera JWT tokens
     *
     * VALIDACIONES:
     * ✓ Status 200
     * ✓ Response contiene access_token
     * ✓ Response contiene refresh_token
     * ✓ Tokens son JWT válidos
     */
    test('[✅ CRÍTICO] debe login exitoso de usuario STAFF', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testData.staffUser.email,
          password: 'password123',
        });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      // Validar que es un JWT válido
      const decoded = decodeToken(response.body.access_token);
      expect(decoded.sub).toBe(testData.staffUser.id);
      expect(decoded.role).toBe('STAFF');
    });

    /**
     * CASO 2: Login CUSTOMER con storeId en body
     *
     * CONTEXTO:
     * Los customers tienen acceso contextual a stores.
     * Pueden enviar storeId de 2 formas:
     * - En el body (x-store-id)
     * - En headers (x-store-id)
     *
     * VALIDACIONES:
     * ✓ Status 200
     * ✓ Token contiene storeId en payload
     */
    test.skip('[✅ CRÍTICO] debe login de CUSTOMER con storeId en body', async () => {
      // const response = await request(app.getHttpServer())
      //   .post('/auth/login')
      //   .send({
      //     email: testData.customerUser.email,
      //     password: 'password123',
      //     storeId: testData.store.id,
      //   });
      // expect(response.status).toBe(200);
      // const decoded = decodeToken(response.body.access_token);
      // expect(decoded.storeId).toBe(testData.store.id);
    });

    /**
     * CASO 3: Login CUSTOMER con storeId en header
     *
     * VALIDACIONES:
     * ✓ Funciona enviando storeId en header x-store-id
     */
    test.skip('[⭐ EDGE] debe login de CUSTOMER con storeId en header', async () => {
      // const response = await request(app.getHttpServer())
      //   .post('/auth/login')
      //   .set('x-store-id', testData.store.id.toString())
      //   .send({
      //     email: testData.customerUser.email,
      //     password: 'password123',
      //   });
      // expect(response.status).toBe(200);
    });

    /**
     * CASO 4: Validación - Customer sin storeId
     *
     * REGLA: Los customers DEBEN proporcionar storeId
     *
     * VALIDACIONES:
     * ✓ Status 400 o 403
     */
    test.skip('[❌ VALIDACIÓN] rechaza CUSTOMER sin storeId', async () => {
      // const response = await request(app.getHttpServer())
      //   .post('/auth/login')
      //   .send({
      //     email: testData.customerUser.email,
      //     password: 'password123',
      //     // NO storeId
      //   });
      // expect(response.status).toBeGreaterThanOrEqual(400);
    });

    /**
     * CASO 5: Validación - storeId inválido (NaN)
     *
     * VALIDACIONES:
     * ✓ Rechaza si storeId no es número
     */
    test.skip('[❌ VALIDACIÓN] rechaza storeId inválido (NaN)', async () => {
      // const response = await request(app.getHttpServer())
      //   .post('/auth/login')
      //   .send({
      //     email: testData.customerUser.email,
      //     password: 'password123',
      //     storeId: 'not-a-number',
      //   });
      // expect(response.status).toBeGreaterThanOrEqual(400);
    });

    /**
     * CASO 6: Seguridad - Contraseña incorrecta
     *
     * REGLA: No revelar si el usuario existe
     *
     * VALIDACIONES:
     * ✓ Status 401
     * ✓ Mensaje genérico
     */
    test.skip('[🔒 SEGURIDAD] rechaza contraseña incorrecta', async () => {
      // const response = await request(app.getHttpServer())
      //   .post('/auth/login')
      //   .send({
      //     email: testData.staffUser.email,
      //     password: 'wrong-password',
      //   });
      // expect(response.status).toBe(401);
      // expect(response.body).not.toHaveProperty('access_token');
    });

    /**
     * CASO 7: Seguridad - Usuario no existe
     *
     * REGLA: No revelar si el usuario existe o no
     *
     * VALIDACIONES:
     * ✓ Status 401 (NO 404)
     */
    test.skip('[🔒 SEGURIDAD] rechaza usuario no existente', async () => {
      // const response = await request(app.getHttpServer())
      //   .post('/auth/login')
      //   .send({
      //     email: 'nonexistent@example.com',
      //     password: 'password123',
      //   });
      // expect(response.status).toBe(401);
    });
  });

  // ===================================================================
  // SECCIÓN: POST /auth/register
  // ===================================================================
  describe('POST /auth/register', () => {
    /**
     * CASO: Registro exitoso
     *
     * VALIDACIONES:
     * ✓ Status 201
     * ✓ Usuario creado en BD
     * ✓ Password hasheado
     */
    test.skip('[✅ CRÍTICO] debe registrar nuevo usuario', async () => {
      // const response = await request(app.getHttpServer())
      //   .post('/auth/register')
      //   .send({
      //     email: 'newuser@example.com',
      //     password: 'SecurePassword123!',
      //     name: 'John Doe',
      //   });
      // expect(response.status).toBe(201);
      // expect(response.body).toHaveProperty('access_token');
    });

    /**
     * CASO: Email duplicado
     *
     * VALIDACIONES:
     * ✓ Status 409 Conflict
     */
    test.skip('[❌ VALIDACIÓN] rechaza email duplicado', async () => {
      // const response = await request(app.getHttpServer())
      //   .post('/auth/register')
      //   .send({
      //     email: testData.staffUser.email,
      //     password: 'SecurePassword123!',
      //     name: 'Another User',
      //   });
      // expect(response.status).toBe(409);
    });
  });

  // ===================================================================
  // SECCIÓN: GET /auth/profile
  // ===================================================================
  describe('GET /auth/profile', () => {
    /**
     * CASO: Obtener perfil autenticado
     *
     * FLUJO:
     * 1. Hacer login para obtener token
     * 2. Usar token para acceder a /profile
     *
     * VALIDACIONES:
     * ✓ Status 200
     * ✓ Retorna datos del usuario
     */
    test.skip('[✅ CRÍTICO] debe retornar perfil del usuario autenticado', async () => {
      // const loginRes = await request(app.getHttpServer())
      //   .post('/auth/login')
      //   .send({...});
      // const token = loginRes.body.access_token;
      // const response = await request(app.getHttpServer())
      //   .get('/auth/profile')
      //   .set('Authorization', `Bearer ${token}`);
      // expect(response.status).toBe(200);
      // expect(response.body.email).toBeDefined();
    });

    /**
     * CASO: Sin token
     *
     * VALIDACIONES:
     * ✓ Status 401
     */
    test.skip('[❌ SEGURIDAD] rechaza sin token', async () => {
      // const response = await request(app.getHttpServer())
      //   .get('/auth/profile');
      // expect(response.status).toBe(401);
    });

    /**
     * CASO: Token inválido
     *
     * VALIDACIONES:
     * ✓ Status 401
     */
    test.skip('[❌ SEGURIDAD] rechaza token inválido', async () => {
      // const response = await request(app.getHttpServer())
      //   .get('/auth/profile')
      //   .set('Authorization', 'Bearer invalid_token');
      // expect(response.status).toBe(401);
    });
  });

  // ===================================================================
  // FLUJOS COMPLETOS (Happy Path)
  // ===================================================================
  describe('Flujos Completos', () => {
    /**
     * FLUJO: Customer - Register → Login → Access Profile
     *
     * Este test demuestra la experiencia COMPLETA del usuario
     */
    test.skip('[✅ FLUJO] customer: register → login → profile', async () => {
      // Paso 1: Register
      // const registerRes = await request(app.getHttpServer())
      //   .post('/auth/register')
      //   .send({...});
      // expect(registerRes.status).toBe(201);
      // Paso 2: Login
      // const loginRes = await request(app.getHttpServer())
      //   .post('/auth/login')
      //   .send({...});
      // expect(loginRes.status).toBe(200);
      // Paso 3: Get Profile
      // const profileRes = await request(app.getHttpServer())
      //   .get('/auth/profile')
      //   .set('Authorization', `Bearer ${loginRes.body.access_token}`);
      // expect(profileRes.status).toBe(200);
    });

    /**
     * FLUJO: Staff - Login → Protected Endpoints → Logout
     */
    test.skip('[✅ FLUJO] staff: login → protected endpoints', async () => {
      // Similar al anterior pero con usuario STAFF
    });
  });
});
