import { Injectable } from '@nestjs/common';
import { PaymentProviderInterface } from '../payment-provider.interface';
import { PayPalConfig } from './paypal.interface';

@Injectable()
export class PaypalService implements PaymentProviderInterface {
  async init(config: PayPalConfig): Promise<void> {
    // TODO: Inicializar SDK de PayPal con config
    return;
  }

  async refund(paymentId: number, amount?: string): Promise<any> {
    // TODO: Llamar a la API de PayPal para crear el reembolso
    return { success: true };
  }
}
