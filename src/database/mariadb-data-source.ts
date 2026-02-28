import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const isProd = process.env.NODE_ENV === 'prod';

/**
 * Datasource para MariaDB - Conexión de lectura desde base de datos externa
 * Se usa para traer datos específicos y sincronizarlos a PostgreSQL
 */
export const MariaDbDataSource = new DataSource({
  type: 'mariadb',
  host: process.env.MARIADB_HOST || '127.0.0.1', // Usar 127.0.0.1 en lugar de localhost para IPv4
  port: parseInt(process.env.MARIADB_PORT || '3306'),
  username: process.env.MARIADB_USER || 'root',
  password: process.env.MARIADB_PASSWORD || '',
  database: process.env.MARIADB_DATABASE,
  synchronize: false,
  logging: !isProd,
  connectTimeout: 10000, // 10 segundos de timeout
  supportBigNumbers: true,
  bigNumberStrings: true,
});
