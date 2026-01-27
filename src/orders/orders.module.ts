import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-items.entity';
import { PickupPoint } from './entities/pickup-point.entity';
import { OrderStatus } from './entities/order-status.entity';
import { Product } from '../products/entities/product.entity';
import { OrdersService } from './services/orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      PickupPoint,
      OrderStatus,
      Product,
    ]),
  ],
  controllers: [],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
