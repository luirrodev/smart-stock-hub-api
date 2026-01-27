import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Store } from './entities/store.entity';
import { StoresService } from './services/stores.service';

@Module({
  imports: [TypeOrmModule.forFeature([Store])],
  controllers: [],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
