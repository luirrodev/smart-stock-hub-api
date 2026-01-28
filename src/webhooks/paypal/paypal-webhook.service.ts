import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  PaypalWebhookEventDto,
  PaypalWebhookEventType,
} from '../dto/paypal-webhook-event.dto';
import { Payment, PaymentStatus } from 'src/payments/entities/payment.entity';
import { StorePaymentConfig } from 'src/payments/entities/store-payment-config.entity';
import { decrypt } from 'src/common/utils/crypto.util';
import {
  PAYPAL_API_URLS,
  PAYPAL_ENDPOINTS,
} from 'src/payments/providers/paypal/paypal.constants';
import { PaypalService } from 'src/payments/providers/paypal/paypal.service';
import { PayPalCredentials } from 'src/payments/providers/paypal/paypal.interface';

@Injectable()
export class PaypalWebhookService {
  private readonly logger = new Logger(PaypalWebhookService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly paypalService: PaypalService,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(StorePaymentConfig)
    private readonly storePaymentConfigRepo: Repository<StorePaymentConfig>,
  ) {}

  // async processEvent(
  //   event: PaypalWebhookEventDto,
  //   headers: Record<string, any>,
  // ) {
  //   this.logger.debug('Received PayPal webhook event', {
  //     eventType: event.event_type,
  //     headers: Object.keys(headers),
  //   });

  //   // 1) Obtener PayPal Order ID (preferir related_ids.order_id)
  //   const paypalOrderId =
  //     event.resource?.supplementary_data?.related_ids?.order_id ||
  //     event.resource?.id;

  //   if (!paypalOrderId) {
  //     this.logger.warn('No PayPal order id found in webhook resource');
  //     return;
  //   }

  //   // 2) Buscar payment local vinculado (providerOrderId)
  //   const payment = await this.paymentRepo.findOne({
  //     where: { providerOrderId: String(paypalOrderId), provider: 'paypal' },
  //   });

  //   if (!payment) {
  //     this.logger.warn(
  //       `No payment found for PayPal order id: ${paypalOrderId}`,
  //     );
  //     return;
  //   }

  //   // 3) Obtener configuración de PayPal de la tienda
  //   const storeConfig = await this.storePaymentConfigRepo.findOne({
  //     where: {
  //       storeId: payment.storeId,
  //       provider: 'paypal',
  //       isActive: true,
  //     },
  //   });

  //   if (!storeConfig) {
  //     this.logger.warn(`No active PayPal config for store ${payment.storeId}`);
  //     return;
  //   }

  //   // 4) Verificar firma (usar webhook id desde env si está configurado)
  //   const webhookId = this.configService.get<string>('PAYPAL_WEBHOOK_ID');
  //   if (!webhookId) {
  //     this.logger.warn(
  //       'PAYPAL_WEBHOOK_ID no configurado en env; se omite verificación (inseguro)',
  //     );
  //   } else {
  //     const ok = await this.verifyWebhookSignature(
  //       headers,
  //       event,
  //       storeConfig,
  //       webhookId,
  //     );
  //     if (!ok) {
  //       this.logger.warn('PayPal webhook signature verification failed');
  //       throw new BadRequestException('Invalid webhook signature');
  //     }
  //   }

  //   // 5) Manejar eventos críticos
  //   switch (event.event_type) {
  //     case PaypalWebhookEventType.PAYMENT_CAPTURE_COMPLETED: {
  //       payment.status = PaymentStatus.COMPLETED;
  //       await this.paymentRepo.save(payment);
  //       await this.updateOrderPaymentStatus(payment.orderId, 'paid');
  //       this.logger.log(`Payment ${payment.id} marked as COMPLETED`);
  //       break;
  //     }

  //     case PaypalWebhookEventType.PAYMENT_CAPTURE_DENIED: {
  //       payment.status = PaymentStatus.FAILED;
  //       await this.paymentRepo.save(payment);
  //       await this.updateOrderPaymentStatus(payment.orderId, 'failed');
  //       this.logger.log(`Payment ${payment.id} marked as FAILED`);
  //       break;
  //     }

  //     case PaypalWebhookEventType.CHECKOUT_ORDER_APPROVED: {
  //       // Opcional: podemos dejar como pending o registrar un log
  //       this.logger.log(
  //         `PayPal order ${paypalOrderId} APPROVED (no capturada aún)`,
  //       );
  //       break;
  //     }

  //     case PaypalWebhookEventType.PAYMENT_CAPTURE_REFUNDED: {
  //       payment.status = PaymentStatus.REFUNDED;
  //       await this.paymentRepo.save(payment);
  //       await this.updateOrderPaymentStatus(payment.orderId, 'refunded');
  //       this.logger.log(`Payment ${payment.id} marked as REFUNDED`);
  //       break;
  //     }

  //     default:
  //       this.logger.warn('Unhandled PayPal event type: ' + event.event_type);
  //   }

  //   return;
  // }

  private async verifyWebhookSignature(
    headers: Record<string, any>,
    event: PaypalWebhookEventDto,
    storeConfig: StorePaymentConfig,
    webhookId: string,
  ): Promise<boolean> {
    try {
      if (!webhookId) {
        this.logger.warn('No webhookId provided for PayPal verification');
        return false;
      }

      const clientId = storeConfig.clientId;
      const secret = decrypt(storeConfig.secret);
      const mode = storeConfig.mode === 'production' ? 'production' : 'sandbox';
      const baseUrl =
        mode === 'production'
          ? PAYPAL_API_URLS.PRODUCTION
          : PAYPAL_API_URLS.SANDBOX;

      // 1) Validar headers necesarios (case-insensitive)
      const authAlgo =
        headers['paypal-auth-algo'] || headers['PAYPAL-AUTH-ALGO'];
      const certUrl = headers['paypal-cert-url'] || headers['PAYPAL-CERT-URL'];
      const transmissionId =
        headers['paypal-transmission-id'] || headers['PAYPAL-TRANSMISSION-ID'];
      const transmissionSig =
        headers['paypal-transmission-sig'] ||
        headers['PAYPAL-TRANSMISSION-SIG'];
      const transmissionTime =
        headers['paypal-transmission-time'] ||
        headers['PAYPAL-TRANSMISSION-TIME'];

      if (!transmissionId || !transmissionSig || !transmissionTime) {
        this.logger.warn('Missing required PayPal webhook signature headers', {
          transmissionId,
          transmissionSig,
          transmissionTime,
        });
        return false;
      }

      // 2) Construir payload de verificación requerido por PayPal
      const payload = {
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: event,
      };

      // 3) Obtener access token reutilizando PaypalService (usa cache si aplica)
      const credentials: PayPalCredentials = {
        clientId,
        secret,
        mode,
      };

      const accessToken = await this.paypalService.getAccessToken(
        storeConfig.storeId,
        credentials,
      );

      // 4) Llamar endpoint de verificación
      const verifyUrl = `${baseUrl}${PAYPAL_ENDPOINTS.VERIFY_WEBHOOK_SIGNATURE}`;
      const verifyResp = await firstValueFrom(
        this.httpService.post(verifyUrl, payload, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      this.logger.debug('PayPal verify response', verifyResp.data);
      return verifyResp.data?.verification_status === 'SUCCESS';
    } catch (error) {
      this.logger.error(
        'Error verifying PayPal webhook signature',
        error?.response?.data || error?.message || error,
      );
      return false;
    }
  }
}
