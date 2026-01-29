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
import { CreateOrderPayPalResponse, PayPalConfig } from './paypal.interface';
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
import { Order } from 'src/orders/entities/order.entity';

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
   * Crea una orden de pago en PayPal
   * @param credentials - Credenciales de la tienda
   * @param orderData - Datos de la orden
   * @param storeId - ID de la tienda (para cache de token)
   */
  async createOrder(
    credentials: PayPalCredentials,
    orderData: Order,
  ): Promise<CreateOrderPayPalResponse> {
    const baseUrl = this.getBaseUrl(credentials.mode);
    const url = `${baseUrl}${PAYPAL_ENDPOINTS.ORDERS}`;

    const total = Number(orderData.total).toFixed(2);
    const subtotal = Number(orderData.subtotal).toFixed(2);
    const shipping = Number(orderData.shippingCost).toFixed(2);
    const tax = Number(orderData.tax).toFixed(2);

    const paypalOrderData: CreatePayPalOrderRequest = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: orderData.id + '',
          amount: {
            currency_code: orderData.currency,
            value: total,
            breakdown: {
              item_total: {
                currency_code: orderData.currency,
                value: subtotal,
              },
              shipping: {
                currency_code: orderData.currency,
                value: shipping,
              },
              tax_total: {
                currency_code: orderData.currency,
                value: tax,
              },
            },
          },
          description: `${orderData.orderNumber}`,
        },
      ],
      application_context: {
        return_url: `${process.env.FRONTEND_URL}/payments/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payments/cancel`,
        brand_name: orderData.store.name,
        user_action: 'PAY_NOW',
      },
    };

    try {
      // 1. Obtener access token
      const accessToken = await this.getAccessToken(
        orderData.storeId,
        credentials,
      );

      // 2. Crear orden en PayPal
      const response = await firstValueFrom(
        this.httpService.post<PayPalOrderResponse>(url, paypalOrderData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      // 3. Log de éxito
      this.logger.log(
        `Orden creada en PayPal. ID: ${response.data.id}, Status: ${response.data.status}`,
      );

      return {
        responseData: response.data,
        payloadData: paypalOrderData,
      };
    } catch (error) {
      this.logger.error(
        'Error creando orden en PayPal:',
        // Axios errors may expose response.data
        error.response?.data || error.message || error,
      );

      // Re-lanzar error con más contexto
      const message =
        error.response?.data?.message || error.message || 'Unknown error';
      throw new Error(`Error de PayPal: ${message}`);
    }
  }

  /**
   * Captura una orden aprobada por el cliente
   * @param orderId - PayPal Order ID
   * @param credentials - Credenciales de la tienda
   * @param storeId - ID de la tienda
   */
  async captureOrder(
    orderId: string,
    credentials: PayPalCredentials,
    storeId: number,
  ): Promise<PayPalCaptureResponse> {
    const baseUrl = this.getBaseUrl(credentials.mode);
    const url = `${baseUrl}${PAYPAL_ENDPOINTS.CAPTURE(orderId)}`;

    try {
      // 1. Obtener access token
      const accessToken = await this.getAccessToken(storeId, credentials);

      // 2. Capturar orden
      const response = await firstValueFrom(
        this.httpService.post<PayPalCaptureResponse>(
          url,
          {},
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      // 3. Log de éxito
      this.logger.log(
        `Orden capturada. ID: ${orderId}, Status: ${response.data.status}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Error capturando orden:',
        error.response?.data || error.message || error,
      );

      const message =
        error.response?.data?.message || error.message || 'Unknown error';
      throw new Error(`Error capturando pago: ${message}`);
    }
  }

  /**
   * Obtiene detalles de una orden de PayPal
   * @param orderId - PayPal Order ID
   * @param credentials - Credenciales de la tienda
   * @param storeId - ID de la tienda
   */
  async getOrderDetails(
    orderId: string,
    credentials: PayPalCredentials,
    storeId: number,
  ): Promise<any> {
    const baseUrl = this.getBaseUrl(credentials.mode);
    const url = `${baseUrl}${PAYPAL_ENDPOINTS.ORDER_DETAILS(orderId)}`;

    try {
      const accessToken = await this.getAccessToken(storeId, credentials);

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Error obteniendo detalles de orden:',
        error.response?.data || error.message || error,
      );

      throw new Error('No se pudo obtener detalles de la orden');
    }
  }

  /**
   * Procesa un reembolso total o parcial
   * @param captureId - ID de la captura (NO el order ID)
   * @param credentials - Credenciales de la tienda
   * @param storeId - ID de la tienda
   * @param refundData - Datos del reembolso (opcional para reembolso total)
   */
  async refundCapture(
    captureId: string,
    credentials: PayPalCredentials,
    storeId: number,
    refundData?: PayPalRefundRequest,
  ): Promise<PayPalRefundResponse> {
    const baseUrl = this.getBaseUrl(credentials.mode);
    const url = `${baseUrl}${PAYPAL_ENDPOINTS.REFUND(captureId)}`;

    try {
      const accessToken = await this.getAccessToken(storeId, credentials);

      const response = await firstValueFrom(
        this.httpService.post<PayPalRefundResponse>(url, refundData || {}, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      this.logger.log(
        `Reembolso procesado. Capture ID: ${captureId}, Status: ${response.data.status}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Error procesando reembolso:',
        error.response?.data || error.message || error,
      );

      const message =
        error.response?.data?.message || error.message || 'Unknown error';
      throw new Error(`Error en reembolso: ${message}`);
    }
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
    storeId: number,
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
  async invalidateToken(storeId: number): Promise<void> {
    const cacheKey = `paypal:token:${storeId}`;
    await this.cacheManager.del(cacheKey);
    this.logger.debug(`Token invalidado para tienda ${storeId}`);
  }
}
