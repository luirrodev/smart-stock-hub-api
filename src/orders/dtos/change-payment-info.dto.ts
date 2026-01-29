import { PaymentStatus } from 'src/payments/entities/payment.entity';

export interface ChangePaymentInfoDto {
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  paymentTransactionId: string;
}
