import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Customer } from './entities/customer.entity';
import { CustomersService } from './services/customers.service';
import { AccessControlModule } from '../access-control/access-control.module';
import { ShippingAddress } from './entities/shipping-address.entity';
import { ShippingAddressesService } from './services/shipping-addresses.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, ShippingAddress]),
    AccessControlModule,
  ],
  controllers: [],
  providers: [CustomersService, ShippingAddressesService],
  exports: [CustomersService, ShippingAddressesService],
})
export class CustomersModule {}
