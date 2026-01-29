import { Global, Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ioRedisStore } from '@tirke/node-cache-manager-ioredis';

import config from 'src/config';
import { SnakeNamingStrategy } from './typeorm-naming-strategy';

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
        const store = await ioRedisStore({
          host: configService.redis.host,
          port: configService.redis.port,
          password: configService.redis.password || undefined,
          db: configService.redis.db,
          ttl: 3600 * 1000, // 1 hora por defecto
        });

        return {
          store,
        };
      },
    }),
  ],
  exports: [TypeOrmModule, CacheModule],
})
export class DatabaseModule {}
