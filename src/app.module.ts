import { ConfigModule, ConfigType } from '@nestjs/config';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import * as Joi from 'joi';

import { enviroments } from './enviroments';
import config from './config';

import { AccessControlModule } from './access-control/access-control.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { CustomersModule } from './customers/customers.module';
import { ProductsModule } from './products/products.module';
import { CartsModule } from './carts/carts.module';
import { InventoryModule } from './inventory/inventory.module';
import { LogsModule } from './logs/logs.module';

import { AppController } from './app.controller';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { JWTAuthGuard } from './auth/guards/jwt-auth.guard';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { RequestContextService } from './common/services/request-context.service';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { OrdersModule } from './orders/orders.module';
import { StoresModule } from './stores/stores.module';
import { PaymentsModule } from './payments/payments.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { StorageModule } from './storage/storage.module';
import { BullModule } from '@nestjs/bull';
import buildRedisUrl from './common/utils/redis.util';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: enviroments[process.env.NODE_ENV as string] || '.env',
      load: [config],
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRES_IN: Joi.string().required(),
        JWT_REFRESH_EXPIRES_IN: Joi.string().required(),
        API_URL_GET_PRODUCTS: Joi.string().required(),
        API_KEY_GET_PRODUCTS: Joi.string().required(),
        PAYMENTS_ENCRYPTION_KEY: Joi.string().required(),
        GOOGLE_CLIENT_ID: Joi.string().required(),
        GOOGLE_CLIENT_SECRET: Joi.string().required(),
        GOOGLE_CALLBACK_URL: Joi.string().required(),
        // MinIO/Storage variables (opcionales)
        MINIO_ENDPOINT: Joi.string().optional(),
        MINIO_PORT: Joi.string().optional(),
        MINIO_ROOT_USER: Joi.string().optional(),
        MINIO_ROOT_PASSWORD: Joi.string().optional(),
        MINIO_USE_SSL: Joi.string().optional(),
        MINIO_BUCKET_NAME: Joi.string().optional(),
        MINIO_PUBLIC_URL: Joi.string().optional(),
      }),
    }),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
    BullModule.forRootAsync({
      inject: [config.KEY],
      useFactory: (configService: ConfigType<typeof config>) => ({
        url: buildRedisUrl(configService.redis),
      }),
    }),
    LogsModule,
    AccessControlModule,
    AuthModule,
    DatabaseModule,
    CustomersModule,
    ProductsModule,
    CartsModule,
    InventoryModule,
    OrdersModule,
    StoresModule,
    PaymentsModule,
    // Desactivado temporalmente
    // WebhooksModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [
    RequestContextService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JWTAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Registrar RequestContextMiddleware para todas las rutas
    // DEBE ser uno de los primeros middlewares para capturar el contexto
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
