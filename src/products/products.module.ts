import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from './entities/product.entity';
import { ProductStore } from './entities/product-store.entity';
import { Store } from '../stores/entities/store.entity';

import { ProductsService } from './services/products.service';
import { ProductStoreService } from './services/product-store.service';

import { ProductsV1Controller, ProductsV2Controller } from './controllers';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductStore, Store])],
  controllers: [ProductsV1Controller, ProductsV2Controller],
  providers: [ProductsService, ProductStoreService],
  exports: [ProductsService, ProductStoreService],
})
export class ProductsModule {}
