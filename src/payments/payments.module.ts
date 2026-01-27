import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Payment } from './entities/payment.entity';
import { StorePaymentConfig } from './entities/store-payment-config.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StorePaymentConfig, Payment, PaymentTransaction]),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class PaymentsModule {}
