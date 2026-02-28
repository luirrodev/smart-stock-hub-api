import { PaymentStatus } from 'src/payments/entities/payment-status.enum';

export interface ChangePaymentInfoDto {
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  paymentTransactionId: string;
}
