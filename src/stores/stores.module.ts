import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Store } from './entities/store.entity';
import { StoresService } from './services/stores.service';
import { StoresController } from './controllers/stores.controller';
import { StoresPaymentConfigService } from './services/stores-payment-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([Store])],
  controllers: [StoresController],
  providers: [StoresService, StoresPaymentConfigService],
  exports: [StoresService],
})
export class StoresModule {}
