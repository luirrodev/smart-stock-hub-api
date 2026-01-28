import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaypalWebhookService } from './paypal-webhook.service';
import { PaypalWebhookEventDto } from '../dto/paypal-webhook-event.dto';

@Controller('webhooks/paypal')
export class PaypalWebhookController {
  constructor(private readonly paypalService: PaypalWebhookService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() event: PaypalWebhookEventDto,
    @Headers() headers: Record<string, string>,
  ) {
    // await this.paypalService.processEvent(event, headers);
    return { received: true };
  }
}
