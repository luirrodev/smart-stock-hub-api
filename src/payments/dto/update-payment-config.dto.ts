import { PaymentMode } from '../entities/store-payment-config.entity';

export class UpdatePaymentConfigDto {
  // Campos opcionales para actualización parcial
  provider?: string;
  clientId?: string;
  secret?: string;
  mode?: PaymentMode;
  isActive?: boolean;
  webhookUrl?: string;
}
