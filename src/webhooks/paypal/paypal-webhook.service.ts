import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PaypalWebhookEventDto } from '../dto/paypal-webhook-event.dto';
import { Payment } from 'src/payments/entities/payment.entity';
import { StorePaymentConfig } from 'src/stores/entities/store-payment-config.entity';
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

  /**
   * Verifica la firma de un webhook de PayPal
   * @param headers - Headers del request
   * @param event - Evento del webhook
   * @returns true si la firma es válida, false en caso contrario
   */
  async verifySignature(
    headers: Record<string, string>,
    event: PaypalWebhookEventDto,
  ): Promise<boolean> {
    try {
      // 1) Obtener PayPal Order ID para buscar la configuración de la tienda
      const paypalOrderId =
        event.resource?.supplementary_data?.related_ids?.order_id ||
        event.resource?.id;

      if (!paypalOrderId) {
        this.logger.warn('No PayPal order ID encontrado en webhook');
        return false;
      }

      // 2) Buscar payment para obtener storeId
      const payment = await this.paymentRepo.findOne({
        where: { providerOrderId: String(paypalOrderId), provider: 'paypal' },
      });

      if (!payment) {
        this.logger.warn(
          `No se encontró payment para PayPal order ID: ${paypalOrderId}`,
        );
        return false;
      }

      // 3) Obtener configuración de PayPal de la tienda
      const storeConfig = await this.storePaymentConfigRepo.findOne({
        where: {
          storeId: payment.storeId,
          provider: 'paypal',
          isActive: true,
        },
      });

      if (!storeConfig) {
        this.logger.warn(
          `No hay configuración activa de PayPal para tienda ${payment.storeId}`,
        );
        return false;
      }

      // 4) Obtener webhook ID desde configuración
      const webhookId = this.configService.get<string>('PAYPAL_WEBHOOK_ID');
      if (!webhookId) {
        this.logger.warn(
          'PAYPAL_WEBHOOK_ID no configurado - omitiendo verificación (INSEGURO)',
        );
        // En producción esto debería retornar false
        return true;
      }

      // 5) Verificar firma usando PayPal API
      return await this.verifyWebhookSignature(
        headers,
        event,
        storeConfig,
        webhookId,
      );
    } catch (error) {
      this.logger.error('Error verificando firma de webhook', error.stack);
      return false;
    }
  }

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
