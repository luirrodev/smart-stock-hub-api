export class UpdatePaymentConfigDto {
  // Campos opcionales para actualización parcial
  provider?: string;
  clientId?: string;
  secret?: string;
  mode?: 'sandbox' | 'production';
  isActive?: boolean;
  webhookUrl?: string;
}
