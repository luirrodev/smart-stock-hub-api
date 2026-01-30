import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Store } from './entities/store.entity';
import { StorePaymentConfig } from './entities/store-payment-config.entity';

import { StoresService } from './services/stores.service';
import { StoresPaymentConfigService } from './services/stores-payment-config.service';

import { StoresController } from './controllers/stores.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Store, StorePaymentConfig])],
  controllers: [StoresController],
  providers: [StoresService, StoresPaymentConfigService],
  exports: [StoresService],
})
export class StoresModule {}
