import { PaymentMode } from '../entities/store-payment-config.entity';

export class CreatePaymentConfigDto {
  // Nombre del proveedor (ej. 'paypal')
  provider: string;

  // Client ID público proporcionado por el proveedor
  clientId: string;

  // Secret cifrado (texto en claro aquí para el DTO; almacenar en DB encriptado)
  secret: string;

  // Modo: 'sandbox' o 'production'
  mode: PaymentMode;

  // Indica si la configuración está activa
  isActive?: boolean;

  // URL de webhook donde el proveedor enviará notificaciones
  webhookUrl?: string;
}
