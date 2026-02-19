import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-items.entity';
import { PickupPoint } from './entities/pickup-point.entity';
import { OrderStatus } from './entities/order-status.entity';
import { Product } from '../products/entities/product.entity';
import { OrdersService } from './services/orders.service';
import { OrderStatusService } from './services/order-status.service';
import { PickupPointService } from './services/pickup-point.service';
import { OrdersController } from './controllers/orders.controller';
import { ProductsModule } from 'src/products/products.module';
import { AccessControlModule } from 'src/access-control/access-control.module';
import { StoresModule } from 'src/stores/stores.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, PickupPoint, OrderStatus]),
    ProductsModule,
    AccessControlModule,
    StoresModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderStatusService, PickupPointService],
  exports: [
    OrdersService,
    OrderStatusService,
    PickupPointService,
    TypeOrmModule,
  ],
})
export class OrdersModule {}
