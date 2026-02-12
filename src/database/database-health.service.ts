import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { DataSource } from 'typeorm';

interface RedisClient {
  ping: () => Promise<string>;
}

interface KeyvStore {
  client?: RedisClient;
}

/**
 * Servicio para verificar las conexiones de la base de datos y Redis
 */
@Injectable()
export class DatabaseHealthService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseHealthService.name);

  constructor(
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async onModuleInit() {
    this.checkDatabaseConnection();
    await this.checkRedisConnection();
  }

  private checkDatabaseConnection(): void {
    try {
      if (this.dataSource.isInitialized) {
        this.logger.log(`✓ PostgreSQL conectado exitosamente`);
      }
    } catch (error) {
      this.logger.error('✗ Error al conectar con PostgreSQL', error);
    }
  }

  private async checkRedisConnection(): Promise<void> {
    try {
      const stores = (this.cacheManager as Cache & { stores?: KeyvStore[] })
        .stores;
      const store = stores?.[0];

      if (store?.client?.ping) {
        // Usar PING para verificar la conexión a Redis
        const response = await store.client.ping();

        if (response === 'PONG') {
          this.logger.log('✓ Redis conectado exitosamente');
        }
      } else {
        // Fallback: hacer un set/get simple si no hay acceso directo al cliente
        await this.cacheManager.set('health:check', 'ok', 5000);
        const result = await this.cacheManager.get('health:check');

        if (result === 'ok') {
          this.logger.log('✓ Redis conectado exitosamente');
          await this.cacheManager.del('health:check');
        }
      }
    } catch (error) {
      this.logger.error('✗ Error al conectar con Redis', error);
    }
  }
}
