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

// Configuración de credenciales de la tienda
export interface PayPalCredentials {
  clientId: string;
  secret: string;
  mode: 'sandbox' | 'production';
}

// Respuesta de autenticación
export interface PayPalAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // en segundos
  scope: string;
}

// Item de la orden
export interface PayPalOrderItem {
  name: string;
  quantity: string;
  unit_amount: {
    currency_code: string;
    value: string;
  };
  description?: string;
  sku?: string;
}

// Request para crear orden
export interface CreatePayPalOrderRequest {
  intent: 'CAPTURE' | 'AUTHORIZE';
  purchase_units: Array<{
    reference_id?: string; // Tu order ID interno
    amount: {
      currency_code: string;
      value: string;
      breakdown?: {
        item_total?: { currency_code: string; value: string };
        shipping?: { currency_code: string; value: string };
        tax_total?: { currency_code: string; value: string };
      };
    };
    items?: PayPalOrderItem[];
    description?: string;
  }>;
  application_context: {
    return_url: string;
    cancel_url: string;
    brand_name?: string;
    locale?: string;
    user_action?: 'PAY_NOW' | 'CONTINUE';
  };
}

// Respuesta de crear orden
export interface PayPalOrderResponse {
  id: string; // PayPal Order ID
  status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED';
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

// Respuesta de captura
export interface PayPalCaptureResponse {
  id: string;
  status: 'COMPLETED' | 'DECLINED' | 'PENDING';
  purchase_units: Array<{
    reference_id: string;
    payments: {
      captures: Array<{
        id: string; // Capture ID (para reembolsos)
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
        final_capture: boolean;
        create_time: string;
      }>;
    };
  }>;
}

// Request de reembolso
export interface PayPalRefundRequest {
  amount?: {
    currency_code: string;
    value: string;
  };
  note_to_payer?: string;
}

// Respuesta de reembolso
export interface PayPalRefundResponse {
  id: string;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  amount: {
    currency_code: string;
    value: string;
  };
}
