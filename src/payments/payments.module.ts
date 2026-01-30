import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Payment } from './entities/payment.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { StoresModule } from '../stores/stores.module';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaypalService } from './providers/paypal/paypal.service';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Payment, PaymentTransaction]),
    StoresModule,
    OrdersModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaypalService],
  exports: [PaymentsService, PaypalService],
})
export class PaymentsModule {}
