export interface PayPalConfig {
  // Client ID público
  clientId: string;

  // Secret (debe almacenarse en DB encriptado)
  secret: string;

  // Mode: 'sandbox' | 'production'
  mode: 'sandbox' | 'production';

  // Webhook URL configurada para esta tienda (opcional)
  webhookUrl?: string;
}
