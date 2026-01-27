import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Payment } from './entities/payment.entity';
import { StorePaymentConfig } from './entities/store-payment-config.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaypalService } from './providers/paypal/paypal.service';
import { PaypalWebhookController } from './providers/paypal/paypal.webhook.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([StorePaymentConfig, Payment, PaymentTransaction]),
  ],
  controllers: [PaymentsController, PaypalWebhookController],
  providers: [PaymentsService, PaypalService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
