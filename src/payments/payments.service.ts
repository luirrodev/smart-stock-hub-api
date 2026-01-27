import { Injectable } from '@nestjs/common';
import { CreatePaymentConfigDto } from './dto/create-payment-config.dto';
import { UpdatePaymentConfigDto } from './dto/update-payment-config.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';

@Injectable()
export class PaymentsService {
  // Placeholder: crea la configuración de pago para la tienda
  async createStorePaymentConfig(
    storeId: number,
    dto: CreatePaymentConfigDto,
  ): Promise<void> {
    // TODO: Implementar lógica real
    return;
  }

  // Placeholder: obtiene la configuración de pago para la tienda
  async getStorePaymentConfig(storeId: number): Promise<void> {
    // TODO: Implementar lógica real
    return;
  }

  // Placeholder: actualiza la configuración de pago
  async updateStorePaymentConfig(
    storeId: number,
    id: number,
    dto: UpdatePaymentConfigDto,
  ): Promise<void> {
    // TODO: Implementar lógica real
    return;
  }

  // Placeholder: procesa un reembolso
  async refundPayment(paymentId: number, dto: RefundPaymentDto): Promise<void> {
    // TODO: Implementar lógica real con provider
    return;
  }
}
