import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { DataSource } from 'typeorm';
import * as net from 'net';
import { ConfigType } from '@nestjs/config';
import config from 'src/config';

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
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
  ) {}

  async onModuleInit() {
    this.checkDatabaseConnection();
    // No bloquear la inicialización con el chequeo de Redis
    this.checkRedisConnection().catch((err) => {
      this.logger.error('Error en verificación de Redis:', err);
    });
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
    return new Promise((resolve) => {
      const { host, port } = this.configService.redis;
      const timeout = 5000; // 5 segundos de timeout

      const socket = net.createConnection({ host, port, timeout });

      socket.on('connect', () => {
        this.logger.log('✓ Redis conectado exitosamente');
        socket.destroy();
        resolve();
      });

      socket.on('timeout', () => {
        this.logger.error('✗ Timeout al conectar con Redis');
        socket.destroy();
        resolve();
      });

      socket.on('error', (err) => {
        this.logger.error(`✗ Error al conectar con Redis: ${err.message}`);
        resolve();
      });
    });
  }
}
