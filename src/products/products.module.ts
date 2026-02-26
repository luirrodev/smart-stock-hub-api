import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from './entities/product.entity';
import { ProductStore } from './entities/product-store.entity';
import { Category } from './entities/category.entity';
import { ProductStoreCategory } from './entities/product-store-category.entity';
import { ProductStoreImage } from './entities/product-store-image.entity';
import { Store } from '../stores/entities/store.entity';

import { ProductsService } from './services/products.service';
import { ProductStoreService } from './services/product-store.service';
import { CategoryService } from './services/category.service';
import { ProductStoreImageService } from './services/product-store-image.service';

import {
  ProductsV1Controller,
  ProductsV2Controller,
  CategoriesV1Controller,
} from './controllers';
import { StoresModule } from 'src/stores/stores.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductStore,
      Category,
      ProductStoreCategory,
      ProductStoreImage,
      Store,
    ]),
    StoresModule,
  ],
  controllers: [
    ProductsV1Controller,
    ProductsV2Controller,
    CategoriesV1Controller,
  ],
  providers: [
    ProductsService,
    ProductStoreService,
    CategoryService,
    ProductStoreImageService,
  ],
  exports: [
    ProductsService,
    ProductStoreService,
    CategoryService,
    ProductStoreImageService,
  ],
})
export class ProductsModule {}
