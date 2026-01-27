import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
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

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
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
    const cacheKey = `paypal:token:${storeId}`;

    // 1. Intentar obtener token desde cache
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      this.logger.debug(`Usando token en cache para tienda ${storeId}`);
      return cached;
    }

    // 2. Generar nuevo token
    this.logger.debug(`Generando nuevo token para tienda ${storeId}`);
    const data = await this.generateAccessToken(credentials);

    // 3. Calcular TTL en ms usando expires_in (dejamos margen de 60s)
    const safetyMarginSec = 60;
    const ttlMs = Math.max((data.expires_in - safetyMarginSec) * 1000, 0);

    // 4. Guardar token en cache con TTL
    await this.cacheManager.set(cacheKey, data.access_token, ttlMs);

    return data.access_token;
  }

  /**
   * Obtiene un access token de PayPal usando client_id y secret
   */
  private async generateAccessToken(
    credentials: PayPalCredentials,
  ): Promise<PayPalAuthResponse> {
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

      return data;
    } catch (error) {
      this.logger.error(
        'Error generando access token:',
        error.response?.data || error.message,
      );
      throw new BadRequestException('No se pudo autenticar con PayPal');
    }
  }

  /**
   * Invalidates cached token for a store (useful when store config changes)
   */
  async invalidateToken(storeId: string): Promise<void> {
    const cacheKey = `paypal:token:${storeId}`;
    await this.cacheManager.del(cacheKey);
    this.logger.debug(`Token invalidado para tienda ${storeId}`);
  }
}
