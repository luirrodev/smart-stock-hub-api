import { Global, Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';

import config from 'src/config';
import { SnakeNamingStrategy } from './typeorm-naming-strategy';
import { DatabaseHealthService } from './services/database-health.service';
import buildRedisUrl from 'src/common/utils/redis.util';

// Constante para el TTL del caché (1 hora)
const CACHE_TTL = 60 * 60 * 1000; // 3600000 ms

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [config.KEY],
      useFactory: (configService: ConfigType<typeof config>) => {
        return {
          type: 'postgres',
          host: configService.database.host,
          port: configService.database.port,
          username: configService.database.username,
          password: configService.database.password,
          database: configService.database.database,
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
  providers: [DatabaseHealthService],
  exports: [CacheModule],
})
export class DatabaseModule {}
