import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Log } from './entities/log.entity';
import { AuditLog } from './entities/audit-log.entity';
import { LoggingService } from './services/logging.service';
import { LogsPersistenceService } from './services/logs-persistence.service';
import { LogsQueryService } from './services/logs-query.service';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { LogsProcessor } from './processors/logs.processor';
import { LogsEventListener } from './listeners/logs-event.listener';
import { AuditSubscriber } from './subscribers/audit.subscriber';
import { LogsController } from './controllers/logs.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Log, AuditLog]),
    BullModule.registerQueue({
      name: 'logs',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
      },
    }),
    EventEmitterModule.forRoot(),
  ],
  providers: [
    LoggingService,
    LogsPersistenceService,
    LogsQueryService,
    LogsProcessor,
    LogsEventListener,
    AuditSubscriber,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
  controllers: [LogsController],
  exports: [LoggingService, LogsPersistenceService],
})
export class LogsModule {}
