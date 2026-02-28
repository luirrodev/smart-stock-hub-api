import { PaymentMode } from 'src/stores/entities/store-payment-config.entity';
import { Order } from 'src/orders/entities/order.entity';

export interface PaymentProviderInterface {
  /**
   * Crea una orden de pago
   * @param credentials - Credenciales del proveedor
   * @param orderData - Datos de la orden
   */
  createOrder(credentials: any, orderData: Order): Promise<any>;

  /**
   * Captura/completa una orden aprobada por el cliente
   * @param orderId - ID de la orden en el proveedor
   * @param credentials - Credenciales del proveedor
   * @param storeId - ID de la tienda
   */
  captureOrder(
    orderId: string,
    credentials: any,
    storeId: number,
  ): Promise<any>;

  /**
   * Obtiene detalles de una orden
   * @param orderId - ID de la orden en el proveedor
   * @param credentials - Credenciales del proveedor
   * @param storeId - ID de la tienda
   */
  getOrderDetails(
    orderId: string,
    credentials: any,
    storeId: number,
  ): Promise<any>;

  /**
   * Realiza un reembolso total o parcial
   * @param captureId - ID de la captura a reembolsar
   * @param credentials - Credenciales del proveedor
   * @param storeId - ID de la tienda
   * @param refundData - Datos del reembolso (opcional)
   */
  refundCapture(
    captureId: string,
    credentials: any,
    storeId: number,
    refundData?: Record<string, any>,
  ): Promise<any>;
}

export interface ProviderConfig {
  clientId: string;
  secret: string;
  mode: PaymentMode;
}
