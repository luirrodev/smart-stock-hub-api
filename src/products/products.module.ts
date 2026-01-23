import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from './entities/product.entity';
import { AccessControlModule } from '../access-control/access-control.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), AccessControlModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class ProductsModule {}
