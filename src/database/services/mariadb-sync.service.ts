import { Injectable, Logger } from '@nestjs/common';
import { MariaDbDataSource } from '../mariadb-data-source';

/**
 * Servicio para sincronizar datos desde MariaDB a PostgreSQL
 * Permite traer datos específicos de MariaDB y guardarlos en PostgreSQL
 */
@Injectable()
export class MariaDbSyncService {
  private readonly logger = new Logger(MariaDbSyncService.name);
  private connectionAttempts = 0;
  private maxRetries = 3;

  /**
   * Inicializa la conexión a MariaDB con reintentos
   */
  async initializeConnection(): Promise<void> {
    if (!MariaDbDataSource.isInitialized) {
      try {
        this.connectionAttempts = 0;
        await this.connectWithRetry();
        this.logger.log('Conexión a MariaDB establecida exitosamente');
      } catch (error) {
        throw error;
      }
    }
  }

  /**
   * Intenta conectar a MariaDB con reintentos
   */
  private async connectWithRetry(): Promise<void> {
    while (this.connectionAttempts < this.maxRetries) {
      try {
        await MariaDbDataSource.initialize();
        return;
      } catch (error) {
        this.connectionAttempts++;
        if (this.connectionAttempts >= this.maxRetries) {
          throw new Error(
            `No se pudo conectar a MariaDB después de ${this.maxRetries} intentos - Error: ${error.message}`,
          );
        }
        this.logger.warn(
          `Intento ${this.connectionAttempts}/${this.maxRetries} de conexión fallido. Reintentando...`,
        );
        // Esperar 2 segundos antes de reintentar
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  /**
   * Ejecuta una query en MariaDB y retorna los resultados
   * @param sql - Query SQL a ejecutar
   * @param params - Parámetros para la query
   * @returns Resultados de la query
   */
  async executeQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      await this.initializeConnection();
      const result = await MariaDbDataSource.query(sql, params);
      return result;
    } catch (error) {
      this.logger.error(`Error ejecutando query en MariaDB: ${error.message}`);
      throw new Error(`Error en query MariaDB: ${error.message}.`);
    }
  }

  /**
   * Obtiene registros de una tabla específica con filtros opcionales
   * @param table - Nombre de la tabla
   * @param columns - Columnas a traer (default: todas)
   * @param where - Cláusula WHERE opcional
   * @returns Array de registros
   */
  async getRecords<T = any>(
    table: string,
    columns: string[] = ['*'],
    where?: string,
  ): Promise<T[]> {
    try {
      await this.initializeConnection();
      const columnsStr = columns.join(', ');
      let sql = `SELECT ${columnsStr} FROM ${table}`;

      if (where) {
        sql += ` WHERE ${where}`;
      }

      this.logger.debug(`Ejecutando query: ${sql}`);
      const result = await MariaDbDataSource.query(sql);
      return result;
    } catch (error) {
      this.logger.error(
        `Error obteniendo registros de ${table}: ${error.message}`,
      );
      throw new Error(
        `Error al obtener registros de '${table}': ${error.message}`,
      );
    }
  }

  /**
   * Obtiene un registro específico por ID
   * @param table - Nombre de la tabla
   * @param id - Valor del ID
   * @param idColumn - Nombre de la columna ID (default: 'id')
   * @returns Registro encontrado o null
   */
  async getRecordById<T = any>(
    table: string,
    id: any,
    idColumn: string = 'id',
  ): Promise<T | null> {
    try {
      await this.initializeConnection();
      const sql = `SELECT * FROM ${table} WHERE ${idColumn} = ?`;
      const result = await MariaDbDataSource.query(sql, [id]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      this.logger.error(
        `Error obteniendo registro de ${table}: ${error.message}`,
      );
      throw new Error(
        `Error al obtener registro de '${table}': ${error.message}`,
      );
    }
  }

  /**
   * Cierra la conexión a MariaDB
   */
  async closeConnection(): Promise<void> {
    if (MariaDbDataSource.isInitialized) {
      await MariaDbDataSource.destroy();
      this.logger.log('Conexión a MariaDB cerrada');
    }
  }
}
