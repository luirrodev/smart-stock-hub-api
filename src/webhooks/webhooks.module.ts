import { Module } from '@nestjs/common';
import { PaypalWebhookController } from './paypal/paypal-webhook.controller';
import { PaypalWebhookService } from './paypal/paypal-webhook.service';
import { StripeWebhookController } from './stripe/stripe-webhook.controller';
import { StripeWebhookService } from './stripe/stripe-webhook.service';

@Module({
  controllers: [PaypalWebhookController, StripeWebhookController],
  providers: [PaypalWebhookService, StripeWebhookService],
  exports: [PaypalWebhookService, StripeWebhookService],
})
export class WebhooksModule {}
