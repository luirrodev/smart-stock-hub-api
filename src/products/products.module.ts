import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from './entities/product.entity';
import { ProductsService } from './services/products.service';
import { ProductsController } from './controllers/products.controller';
import { AccessControlModule } from '../access-control/access-control.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), AccessControlModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
