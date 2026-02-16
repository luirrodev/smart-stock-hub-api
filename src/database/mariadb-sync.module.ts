import { Module } from '@nestjs/common';
import { MariaDbSyncService } from './services/mariadb-sync.service';

/**
 * Módulo para sincronización de datos desde MariaDB a PostgreSQL
 * Proporciona servicios para traer datos de MariaDB de forma simple
 */
@Module({
  providers: [MariaDbSyncService],
  exports: [MariaDbSyncService],
})
export class MariaDbSyncModule {}
