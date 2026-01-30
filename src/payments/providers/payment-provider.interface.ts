import { PaymentMode } from 'src/stores/entities/store-payment-config.entity';

export interface PaymentProviderInterface {
  // Inicializa o configura el provider con datos de configuración de tienda
  init(config: Record<string, any>): Promise<void>;

  // Captura o completa un pago existente si aplica
  capture?(paymentId: number): Promise<any>;

  // Realiza un reembolso
  refund(paymentId: number, amount?: string): Promise<any>;
}

export interface ProviderConfig {
  clientId: string;
  secret: string;
  mode: PaymentMode;
}
