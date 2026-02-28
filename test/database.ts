/**
 * Utilidades para Database de Pruebas E2E
 *
 * Este archivo proporciona funciones auxiliares para:
 * - Configurar una base de datos PostgreSQL dedicada para pruebas
 * - Limpiar y resetear datos entre pruebas
 * - Seedear datos de prueba
 * - Manejar transacciones para aislamiento de pruebas
 */

import { DataSource } from 'typeorm';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

let testDataSource: DataSource | null = null;

/**
 * Crea una conexión de data source para pruebas e2e
 * Utiliza una base de datos separada con sufijo "_e2e_test"
 *
 * Primero crea la BD si no existe, luego se conecta a ella
 *
 * @returns {Promise<DataSource>} Instancia configurada de DataSource
 */
export async function createTestDataSource(): Promise<DataSource> {
  if (testDataSource) {
    return testDataSource;
  }

  const baseDatabase = process.env.DB_NAME || 'smart_stock_hub_db';
  const testDatabase = `${baseDatabase}_e2e_test`;
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '5433', 10);
  const dbUser = process.env.DB_USER || 'root';
  const dbPass = process.env.DB_PASS || '12345678';

  // Paso 1: Conectarse a BD por defecto para crear la BD de test
  let createDbDataSource: DataSource | null = null;
  try {
    createDbDataSource = new DataSource({
      type: 'postgres',
      host: dbHost,
      port: dbPort,
      username: dbUser,
      password: dbPass,
      database: 'postgres', // Conectarse a BD por defecto
      synchronize: false,
      logging: false,
    });

    if (!createDbDataSource.isInitialized) {
      await createDbDataSource.initialize();
    }

    // Crear BD de test si no existe
    try {
      await createDbDataSource.query(`CREATE DATABASE "${testDatabase}";`);
      console.log(`📦 Base de datos "${testDatabase}" creada`);
    } catch (error: any) {
      if (error.code === '42P04') {
        // BD ya existe, está bien
        console.log(`📦 Base de datos "${testDatabase}" ya existe`);
      } else {
        throw error;
      }
    }

    await createDbDataSource.destroy();
  } catch (error) {
    if (createDbDataSource?.isInitialized) {
      await createDbDataSource.destroy();
    }
    console.error('Error creating test database:', error);
    throw error;
  }

  // Paso 2: Conectarse a la BD de test
  testDataSource = new DataSource({
    type: 'postgres',
    host: dbHost,
    port: dbPort,
    username: dbUser,
    password: dbPass,
    database: testDatabase,
    entities: [path.join(__dirname, '../src/**/*.entity.ts')],
    migrations: [path.join(__dirname, '../src/database/migrations/*.ts')],
    synchronize: true,
    logging: false,
    dropSchema: false,
    extra: {
      statement_timeout: 10000,
    },
  });

  try {
    if (!testDataSource.isInitialized) {
      await testDataSource.initialize();
    }
  } catch (error) {
    console.error('Error initializing test data source:', error);
    testDataSource = null;
    throw error;
  }

  return testDataSource;
}

/**
 * Cierra la conexión de base de datos después de las pruebas
 */
export async function closeTestDatabase(): Promise<void> {
  if (testDataSource && testDataSource.isInitialized) {
    await testDataSource.destroy();
    testDataSource = null;
  }
}

/**
 * Limpia todas las tablas manteniendo la estructura
 * Útil para resetear el estado entre pruebas
 *
 * @param {DataSource} dataSource - Instancia de DataSource
 */
export async function cleanDatabase(dataSource: DataSource): Promise<void> {
  if (!dataSource.isInitialized) {
    throw new Error('DataSource not initialized');
  }

  const entities = dataSource.entityMetadatas;
  const tableNames = entities
    .map((entity) => entity.tableName)
    .filter((name) => name !== 'migrations');

  // Desactivar restricciones de clave foránea temporalmente
  await dataSource.query('SET session_replication_role = REPLICA');

  for (const tableName of tableNames) {
    try {
      await dataSource.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
    } catch (error) {
      console.warn(`Could not truncate table ${tableName}:`, error);
    }
  }

  // Reactivar restricciones
  await dataSource.query('SET session_replication_role = DEFAULT');
}

/**
 * Resetea las secuencias de ID de las tablas
 * Importante para tener IDs predecibles en pruebas
 *
 * @param {DataSource} dataSource - Instancia de DataSource
 */
export async function resetSequences(dataSource: DataSource): Promise<void> {
  if (!dataSource.isInitialized) {
    throw new Error('DataSource not initialized');
  }

  const entities = dataSource.entityMetadatas;
  for (const entity of entities) {
    try {
      const query = `
        SELECT SETVAL(
          pg_get_serial_sequence('"${entity.tableName}"', 'id'),
          COALESCE(MAX(id), 0) + 1
        )
        FROM "${entity.tableName}";
      `;
      await dataSource.query(query);
    } catch (error) {
      console.warn(
        `Could not reset sequence for table ${entity.tableName}:`,
        error,
      );
    }
  }
}

/**
 * Obtiene la instancia actual de test DataSource
 * Para ser usado dentro de tests que ya inicializaron la BD
 *
 * @returns {DataSource | null} Instancia de DataSource o null
 */
export function getTestDataSource(): DataSource | null {
  return testDataSource;
}
