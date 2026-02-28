import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-items.entity';
import { PickupPoint } from './entities/pickup-point.entity';
import { OrderStatus } from './entities/order-status.entity';

import { OrdersService } from './services/orders.service';
import { OrderStatusService } from './services/order-status.service';
import { PickupPointService } from './services/pickup-point.service';

import { OrdersV1Controller } from './controllers';

import { ProductsModule } from 'src/products/products.module';
import { StoresModule } from 'src/stores/stores.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, PickupPoint, OrderStatus]),
    ProductsModule,
    StoresModule,
  ],
  controllers: [OrdersV1Controller],
  providers: [OrdersService, OrderStatusService, PickupPointService],
  exports: [
    OrdersService,
    OrderStatusService,
    PickupPointService,
    TypeOrmModule,
  ],
})
export class OrdersModule {}
