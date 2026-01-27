import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from './entities/order.entity';
import { PickupPoint } from './entities/pickup-point.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, PickupPoint])],
  controllers: [],
  providers: [],
  exports: [],
})
export class OrdersModule {}
