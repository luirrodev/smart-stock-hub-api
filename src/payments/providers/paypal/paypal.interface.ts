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

export const PAYPAL_API_URLS = {
  SANDBOX: 'https://api-m.sandbox.paypal.com',
  PRODUCTION: 'https://api-m.paypal.com',
};

export const PAYPAL_ENDPOINTS = {
  TOKEN: '/v1/oauth2/token',
  ORDERS: '/v2/checkout/orders',
  CAPTURE: (orderId: string) => `/v2/checkout/orders/${orderId}/capture`,
  ORDER_DETAILS: (orderId: string) => `/v2/checkout/orders/${orderId}`,
  REFUND: (captureId: string) => `/v2/payments/captures/${captureId}/refund`,
};
