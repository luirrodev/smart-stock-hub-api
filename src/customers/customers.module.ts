import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Customer } from './entities/customer.entity';
import { CustomersService } from './services/customers.service';
import { AccessControlModule } from '../access-control/access-control.module';

@Module({
  imports: [TypeOrmModule.forFeature([Customer]), AccessControlModule],
  controllers: [],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
