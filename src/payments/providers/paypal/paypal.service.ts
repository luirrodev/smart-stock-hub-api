import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PaymentProviderInterface } from '../payment-provider.interface';
import { PayPalConfig } from './paypal.interface';
import {
  PAYPAL_API_URLS,
  PAYPAL_ENDPOINTS,
  PayPalMode,
} from './paypal.constants';
import {
  CreatePayPalOrderRequest,
  PayPalCredentials,
  PayPalAuthResponse,
  PayPalOrderResponse,
  PayPalOrderItem,
  PayPalCaptureResponse,
  PayPalRefundRequest,
  PayPalRefundResponse,
} from './paypal.interface';

@Injectable()
export class PaypalService implements PaymentProviderInterface {
  private readonly logger = new Logger(PaypalService.name);

  // Cache de tokens por tienda
  // Key: storeId, Value: { token, expiresAt }
  // ToDO: Implementar cache con expiración adecuada
  private tokenCache = new Map<string, { token: string; expiresAt: Date }>();
  constructor(private readonly httpService: HttpService) {
    this.logger.log('PayPal service initialized');
  }
  async init(config: PayPalConfig): Promise<void> {
    // TODO: Inicializar SDK de PayPal con config
    return;
  }

  async refund(paymentId: number, amount?: string): Promise<any> {
    // TODO: Llamar a la API de PayPal para crear el reembolso
    return { success: true };
  }

  /**
   * Obtiene la URL base de PayPal según el modo (sandbox/production)
   */
  private getBaseUrl(mode: 'sandbox' | 'production'): string {
    return mode === 'production'
      ? PAYPAL_API_URLS.PRODUCTION
      : PAYPAL_API_URLS.SANDBOX;
  }

  /**
   * Obtiene un access token de PayPal usando client_id y secret
   * El token expira en ~9 horas
   */
  /**
   * Obtiene un access token, usando cache si está disponible
   * @param storeId - ID de la tienda (para cache multitienda)
   * @param credentials - Credenciales de PayPal
   */
  async getAccessToken(
    storeId: string,
    credentials: PayPalCredentials,
  ): Promise<string> {
    // 1. Buscar en cache
    const cached = this.tokenCache.get(storeId);

    // 2. Si existe y no expiró, usar cache
    if (cached && cached.expiresAt > new Date()) {
      this.logger.debug(`Usando token en cache para tienda ${storeId}`);
      return cached.token;
    }

    // 3. Si no, generar nuevo
    this.logger.debug(`Generando nuevo token para tienda ${storeId}`);
    const newToken = await this.generateAccessToken(credentials);

    // 4. Guardar en cache (expira en 8 horas, dejamos margen de 1 hora)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8);

    this.tokenCache.set(storeId, {
      token: newToken,
      expiresAt,
    });

    return newToken;
  }

  /**
   * Obtiene un access token de PayPal usando client_id y secret
   */
  private async generateAccessToken(
    credentials: PayPalCredentials,
  ): Promise<string> {
    const baseUrl = this.getBaseUrl(credentials.mode);
    const url = `${baseUrl}${PAYPAL_ENDPOINTS.TOKEN}`;

    // 1. Crear autenticación Basic (base64 de client_id:secret)
    const auth = Buffer.from(
      `${credentials.clientId}:${credentials.secret}`,
    ).toString('base64');

    try {
      // 2. Hacer request usando HttpService
      const response = await firstValueFrom(
        this.httpService.post<PayPalAuthResponse>(
          url,
          'grant_type=client_credentials', // Body en formato form-urlencoded
          {
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      const data = response.data;

      this.logger.debug(
        `Token generado exitosamente. Expira en ${data.expires_in}s`,
      );

      return data.access_token;
    } catch (error) {
      this.logger.error(
        'Error generando access token:',
        error.response?.data || error.message,
      );
      throw new BadRequestException('No se pudo autenticar con PayPal');
    }
  }
}
