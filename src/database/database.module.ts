import { Global, Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';

import config from 'src/config';
import { SnakeNamingStrategy } from './typeorm-naming-strategy';

// Constante para el TTL del caché (1 hora)
const CACHE_TTL = 60 * 60 * 1000; // 3600000 ms

/**
 * Construye la URL de conexión a Redis a partir de la configuración
 */
function buildRedisUrl(
  redisConfig: ConfigType<typeof config>['redis'],
): string {
  const { url, host, port, db, password, username, tls } = redisConfig;

  // Si existe una URL completa (p.ej. de Render), usarla directamente
  if (url) {
    return url;
  }

  // Determinar el protocolo según TLS
  const protocol = tls ? 'rediss' : 'redis';

  // Construir la parte de autenticación
  let auth = '';
  if (username || password) {
    const encodedUsername = username ? encodeURIComponent(username) : '';
    const encodedPassword = password ? encodeURIComponent(password) : '';
    auth = `${encodedUsername}:${encodedPassword}@`;
  }

  // Construir la URL completa
  return `${protocol}://${auth}${host}:${port}/${db}`;
}

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [config.KEY],
      useFactory: (configService: ConfigType<typeof config>) => {
        return {
          type: 'postgres',
          url: configService.database.url,
          synchronize: false,
          autoLoadEntities: true,
          namingStrategy: new SnakeNamingStrategy(),
        };
      },
    }),
    CacheModule.registerAsync({
      inject: [config.KEY],
      isGlobal: true,
      useFactory: async (configService: ConfigType<typeof config>) => {
        const redisUrl = buildRedisUrl(configService.redis);

        return {
          stores: [new KeyvRedis(redisUrl)],
          ttl: CACHE_TTL,
        };
      },
    }),
  ],
  exports: [TypeOrmModule, CacheModule],
})
export class DatabaseModule {}
