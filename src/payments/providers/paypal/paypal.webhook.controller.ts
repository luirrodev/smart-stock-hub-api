import { Controller, Post, Body, HttpCode } from '@nestjs/common';

@Controller('webhooks/paypal')
export class PaypalWebhookController {
  // Webhook placeholder para PayPal
  @Post()
  @HttpCode(204)
  async handleWebhook(@Body() body: any): Promise<void> {
    // TODO: Validar la firma y procesar el webhook
    return;
  }
}
