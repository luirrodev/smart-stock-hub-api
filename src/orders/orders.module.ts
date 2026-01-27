import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from './entities/order.entity';
import { PickupPoint } from './entities/pickup-point.entity';
import { OrderStatus } from './entities/order-status.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, PickupPoint, OrderStatus])],
  controllers: [],
  providers: [],
  exports: [],
})
export class OrdersModule {}
