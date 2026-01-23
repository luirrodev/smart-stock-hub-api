import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { Product } from './entities/product.entity';
import { AccessControlModule } from '../access-control/access-control.module';
import { ProductsService } from './services/products.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    AccessControlModule,
    HttpModule,
  ],
  controllers: [],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
