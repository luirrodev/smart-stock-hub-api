import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PaypalWebhookService } from './paypal-webhook.service';
import {
  PaypalWebhookEventDto,
  PaypalWebhookEventType,
} from '../dto/paypal-webhook-event.dto';
import { PaymentsService } from 'src/payments/services/payments.service';
import { OptionalAuth } from 'src/auth/decorators/optional-auth.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('webhooks/paypal')
export class PaypalWebhookController {
  private readonly logger = new Logger(PaypalWebhookController.name);

  constructor(
    private readonly webhookService: PaypalWebhookService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() event: PaypalWebhookEventDto,
    @Headers() headers: Record<string, string>,
  ) {
    // 1. Recibe request
    this.logger.debug('Webhook recibido de PayPal', {
      eventType: event.event_type,
      resourceId: event.resource?.id,
    });

    // 2. Extrae headers y body
    // 3. Verifica firma
    const isValid = await this.webhookService.verifySignature(headers, event);

    if (!isValid) {
      this.logger.warn('Firma de webhook inválida - rechazando solicitud');
      throw new ForbiddenException('Invalid webhook signature');
    }

    // 4. Identificar evento y delegar
    try {
      switch (event.event_type) {
        case PaypalWebhookEventType.PAYMENT_CAPTURE_COMPLETED:
          await this.handleCaptureCompleted(event);
          break;

        case PaypalWebhookEventType.PAYMENT_CAPTURE_DENIED:
          await this.handleCaptureDenied(event);
          break;

        case PaypalWebhookEventType.CHECKOUT_ORDER_APPROVED:
          await this.handleOrderApproved(event);
          break;

        case PaypalWebhookEventType.PAYMENT_CAPTURE_REFUNDED:
          await this.handleRefunded(event);
          break;

        default:
          this.logger.warn('Tipo de evento no manejado: ' + event.event_type);
      }
    } catch (error) {
      this.logger.error('Error procesando webhook de PayPal', error.stack);
      // Aún así devolvemos 200 para evitar reintentos innecesarios de PayPal
    }

    // 6-7. Registrar evento y responder
    this.logger.log(`Webhook procesado: ${event.event_type}`);
    return { received: true };
  }

  /**
   * Handler para PAYMENT.CAPTURE.COMPLETED
   * Delega a PaymentsService para capturar el pago
   */
  private async handleCaptureCompleted(event: PaypalWebhookEventDto) {
    const paypalOrderId =
      event.resource?.supplementary_data?.related_ids?.order_id ||
      event.resource?.id;

    if (!paypalOrderId) {
      this.logger.warn('No se encontró PayPal order ID en el evento');
      return;
    }

    const captureId = event.resource?.id;

    this.logger.log(
      `PAYMENT.CAPTURE.COMPLETED - Order: ${paypalOrderId}, Capture: ${captureId}`,
    );

    await this.paymentsService.capturePaymentViaWebhook(
      paypalOrderId,
      captureId,
    );
  }

  /**
   * Handler para PAYMENT.CAPTURE.DENIED
   */
  private async handleCaptureDenied(event: PaypalWebhookEventDto) {
    const paypalOrderId =
      event.resource?.supplementary_data?.related_ids?.order_id ||
      event.resource?.id;

    if (!paypalOrderId) {
      this.logger.warn('No se encontró PayPal order ID en el evento');
      return;
    }

    this.logger.log(`PAYMENT.CAPTURE.DENIED - Order: ${paypalOrderId}`);

    await this.paymentsService.markPaymentAsFailed(paypalOrderId);
  }

  /**
   * Handler para CHECKOUT.ORDER.APPROVED
   */
  private async handleOrderApproved(event: PaypalWebhookEventDto) {
    const paypalOrderId = event.resource?.id;

    if (!paypalOrderId) {
      this.logger.warn('No se encontró PayPal order ID en el evento');
      return;
    }

    this.logger.log(
      `CHECKOUT.ORDER.APPROVED - Order: ${paypalOrderId} (pendiente de captura)`,
    );
    // Opcional: registrar log o actualizar estado intermedio
  }

  /**
   * Handler para PAYMENT.CAPTURE.REFUNDED
   */
  private async handleRefunded(event: PaypalWebhookEventDto) {
    const paypalOrderId =
      event.resource?.supplementary_data?.related_ids?.order_id ||
      event.resource?.id;

    if (!paypalOrderId) {
      this.logger.warn('No se encontró PayPal order ID en el evento');
      return;
    }

    const refundId = event.resource?.id;

    this.logger.log(
      `PAYMENT.CAPTURE.REFUNDED - Order: ${paypalOrderId}, Refund: ${refundId}`,
    );

    await this.paymentsService.markPaymentAsRefunded(paypalOrderId);
  }
}
