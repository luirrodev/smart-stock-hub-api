import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsModule } from 'src/products/products.module';

import { Customer } from './entities/customer.entity';
import { CustomerController } from './controllers/customers.controller';
import { CustomersService } from './services/customers.service';
import { OrderProduct } from './entities/order-product.entity';
import { OrderProductController } from './controllers/order-product.controller';
import { OrderProductService } from './services/order-product.service';
import { Order } from './entities/order.entity';
import { OrdersController } from './controllers/orders.controller';
import { OrdersService } from './services/orders.service';
import { User } from './entities/user.entity';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';

@Module({
  imports: [
    ProductsModule,
    TypeOrmModule.forFeature([Customer, User, Order, OrderProduct]),
  ],
  controllers: [
    CustomerController,
    UsersController,
    OrdersController,
    OrderProductController,
  ],
  providers: [
    CustomersService,
    UsersService,
    OrdersService,
    OrderProductService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
