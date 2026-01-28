import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PaypalWebhookController } from './paypal/paypal-webhook.controller';
import { PaypalWebhookService } from './paypal/paypal-webhook.service';
import { StripeWebhookController } from './stripe/stripe-webhook.controller';
import { StripeWebhookService } from './stripe/stripe-webhook.service';
import { Payment } from 'src/payments/entities/payment.entity';
import { StorePaymentConfig } from 'src/payments/entities/store-payment-config.entity';
import { PaymentsModule } from 'src/payments/payments.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    TypeOrmModule.forFeature([Payment, StorePaymentConfig]),
    PaymentsModule,
  ],
  controllers: [PaypalWebhookController, StripeWebhookController],
  providers: [PaypalWebhookService, StripeWebhookService],
  exports: [PaypalWebhookService, StripeWebhookService],
})
export class WebhooksModule {}
