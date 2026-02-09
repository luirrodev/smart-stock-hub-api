/**
 * Helpers para Pruebas E2E de Autenticación
 *
 * Proporciona funciones auxiliares para:
 * - Crear usuarios de prueba directamente en la BD
 * - Extraer tokens de respuestas
 * - Seedear datos necesarios para tests de auth
 */

import { DataSource } from 'typeorm';
import * as bcryptjs from 'bcryptjs';

/**
 * Interfaz para facilitar la creación de usuarios de prueba
 */
export interface CreateTestUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  roleId?: number;
  customerId?: number;
}

/**
 * Crea un usuario (Staff o Customer) de prueba en la base de datos
 *
 * @param {DataSource} dataSource - Conexión a la BD
 * @param {CreateTestUserDto} userData - Datos del usuario a crear
 * @param {number} roleId - ID del rol (1 para admin/staff, 2 para customer)
 * @returns {Promise<any>} Objeto del usuario creado
 */
export async function createTestUser(
  dataSource: DataSource,
  userData: CreateTestUserDto,
  roleId: number = 2, // Customer por defecto
): Promise<any> {
  const hashedPassword = await bcryptjs.hash(userData.password, 10);

  const userResult = await dataSource.query(
    `
    INSERT INTO "user" ("email", "password", "firstName", "lastName", "roleId", "customerId", "createdAt", "isActive")
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), true)
    RETURNING *
    `,
    [
      userData.email,
      hashedPassword,
      userData.firstName || 'Test',
      userData.lastName || 'User',
      roleId,
      userData.customerId || null,
    ],
  );

  return userResult[0];
}

/**
 * Crea un usuario STAFF (admin/gerente) de prueba
 *
 * @param {DataSource} dataSource - Conexión a la BD
 * @param {Partial<CreateTestUserDto>} userData - Datos del usuario
 * @returns {Promise<any>} Objeto del usuario creado
 */
export async function createTestStaffUser(
  dataSource: DataSource,
  userData: Partial<CreateTestUserDto> = {},
): Promise<any> {
  const defaultData: CreateTestUserDto = {
    email: 'staff@example.com',
    password: 'staffPassword123!',
    firstName: 'Admin',
    lastName: 'User',
    ...userData,
  };

  // Rol 1 = STAFF/ADMIN
  return createTestUser(dataSource, defaultData, 1);
}

/**
 * Crea un usuario CUSTOMER (cliente) de prueba
 *
 * @param {DataSource} dataSource - Conexión a la BD
 * @param {Partial<CreateTestUserDto>} userData - Datos del usuario
 * @returns {Promise<any>} Objeto del usuario creado
 */
export async function createTestCustomerUser(
  dataSource: DataSource,
  customerId?: number,
  userData: Partial<CreateTestUserDto> = {},
): Promise<any> {
  const defaultData: CreateTestUserDto = {
    email: 'customer@example.com',
    password: 'customerPassword123!',
    firstName: 'Customer',
    lastName: 'User',
    ...userData,
  };

  // Rol 2 = CUSTOMER
  return createTestUser(dataSource, defaultData, 2);
}

/**
 * Crea una Tienda (Store) de prueba en la BD
 *
 * @param {DataSource} dataSource - Conexión a la BD
 * @param {Partial<any>} storeData - Datos adicionales de la tienda
 * @returns {Promise<any>} Objeto de la tienda creada
 */
export async function createTestStore(
  dataSource: DataSource,
  storeData: Partial<any> = {},
): Promise<any> {
  const storeResult = await dataSource.query(
    `
    INSERT INTO "store" ("name", "address", "phone", "email", "createdAt", "isActive")
    VALUES ($1, $2, $3, $4, NOW(), true)
    RETURNING *
    `,
    [
      storeData.name || `Test Store ${Date.now()}`,
      storeData.address || '123 Test St',
      storeData.phone || '5551234567',
      storeData.email || `store${Date.now()}@example.com`,
    ],
  );

  return storeResult[0];
}

/**
 * Registra un cliente en una tienda específica (StoreUser)
 * Necesario para que los clientes puedan loguearse en tiendas específicas
 *
 * @param {DataSource} dataSource - Conexión a la BD
 * @param {number} customerId - ID del cliente
 * @param {number} storeId - ID de la tienda
 * @returns {Promise<any>} Objeto del registro StoreUser
 */
export async function registerCustomerToStore(
  dataSource: DataSource,
  customerId: number,
  storeId: number,
): Promise<any> {
  const storeUserResult = await dataSource.query(
    `
    INSERT INTO "store_user" ("customerId", "storeId", "isActive", "createdAt")
    VALUES ($1, $2, true, NOW())
    RETURNING *
    `,
    [customerId, storeId],
  );

  return storeUserResult[0];
}

/**
 * Extrae el token JWT de una respuesta de login
 *
 * @param {any} response - Respuesta del endpoint de login
 * @returns {string} Access token extraído
 */
export function extractAccessToken(response: any): string {
  return response.body?.access_token || '';
}

/**
 * Extrae el refresh token de una respuesta de login
 *
 * @param {any} response - Respuesta del endpoint de login
 * @returns {string} Refresh token extraído
 */
export function extractRefreshToken(response: any): string {
  return response.body?.refresh_token || '';
}

/**
 * Decodifica un JWT de forma simplificada (sin validar firma)
 * Útil solo para verificar contenido en tests
 *
 * @param {string} token - JWT token
 * @returns {any} Payload decodificado
 *
 * @example
 * const decoded = decodeToken(accessToken);
 * console.log(decoded.sub); // ID del usuario
 * console.log(decoded.storeId); // ID de la tienda (si aplica)
 */
export function decodeToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch (error) {
    throw new Error(`Failed to decode token: ${error.message}`);
  }
}

/**
 * Seedea datos iniciales necesarios para pruebas
 * Crea roles, usuarios y tiendas de prueba
 *
 * @param {DataSource} dataSource - Conexión a la BD
 * @returns {Promise<any>} Objeto con references a usuarios y tiendas creadas
 */
export async function seedTestData(dataSource: DataSource): Promise<any> {
  // Crear roles si no existe
  const roles = [
    { id: 1, name: 'staff' },
    { id: 2, name: 'customer' },
  ];

  for (const role of roles) {
    await dataSource.query(
      `
      INSERT INTO "role" ("id", "name", "createdAt")
      VALUES ($1, $2, NOW())
      ON CONFLICT ("id") DO NOTHING
      `,
      [role.id, role.name],
    );
  }

  // Crear tienda de prueba
  const store = await createTestStore(dataSource, {
    name: 'Test Store',
  });

  // Crear usuario STAFF
  const staffUser = await createTestStaffUser(dataSource, {
    email: 'staff@test.com',
  });

  // Crear usuario CUSTOMER
  const customerUser = await createTestCustomerUser(dataSource, undefined, {
    email: 'customer@test.com',
  });

  // Registrar el cliente en la tienda
  const storeUser = await registerCustomerToStore(
    dataSource,
    customerUser.id,
    store.id,
  );

  return {
    store,
    staffUser,
    customerUser,
    storeUser,
  };
}
