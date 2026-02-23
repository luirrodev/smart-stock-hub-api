import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from './entities/product.entity';
import { ProductsService } from './services/products.service';
import { ProductsV1Controller, ProductsV2Controller } from './controllers';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductsV1Controller, ProductsV2Controller],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
