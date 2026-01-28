import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StripeWebhookService } from './stripe-webhook.service';
import { StripeWebhookEventDto } from '../dto/stripe-webhook-event.dto';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(private readonly stripeService: StripeWebhookService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() event: StripeWebhookEventDto,
    @Headers() headers: Record<string, string>,
  ) {
    await this.stripeService.processEvent(event, headers);
    return { received: true };
  }
}
