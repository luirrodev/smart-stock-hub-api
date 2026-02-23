import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';

import { CartService } from './services/carts.service';
import { CartsV1Controller } from './controllers/';

import { ProductsModule } from '../products/products.module';
import { StoresModule } from 'src/stores/stores.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, CartItem]),
    ProductsModule,
    StoresModule,
  ],
  controllers: [CartsV1Controller],
  providers: [CartService],
  exports: [CartService],
})
export class CartsModule {}
