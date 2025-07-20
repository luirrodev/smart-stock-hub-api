import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Brand } from './entities/brand.entity';
import { BrandsController } from './controllers/brands.controller';
import { BrandsService } from './services/brands.service';
import { Category } from './entities/category.entity';
import { CategoriesController } from './controllers/categories.controller';
import { CategoriesService } from './services/categories.service';
import { Product } from './entities/product.entity';
import { ProductsController } from './controllers/products.controller';
import { ProductsService } from './services/products.service';
import { Warehouse } from './entities/warehouse.entity';
import { WarehousesService } from './services/warehouses.service';
import { UsersModule } from 'src/users/users.module';
import { WarehousesController } from './controllers/warehouses.controller';
import { Inventory } from './entities/inventory.entity';
import { InventoryController } from './controllers/inventory.controller';
import { InventoryService } from './services/inventory.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Brand, Category, Warehouse, Inventory]),
    UsersModule,
  ],
  controllers: [
    ProductsController,
    CategoriesController,
    BrandsController,
    WarehousesController,
    InventoryController,
  ],
  providers: [
    ProductsService,
    CategoriesService,
    BrandsService,
    WarehousesService,
    InventoryService,
  ],
  exports: [ProductsService, TypeOrmModule, WarehousesService],
})
export class ProductsModule {}
