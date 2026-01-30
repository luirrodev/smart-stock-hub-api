import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '../entities/payment-status.enum';

export class CreatePaymentResponseDto {
  @ApiProperty({
    example: PaymentStatus.CREATED,
    description: 'Estado del pago',
  })
  status: PaymentStatus;

  @ApiProperty({
    example: 'https://www.paypal.com/checkoutnow?token=5O190127TN364715T',
    description: 'URL de aprobación para redirigir al cliente',
  })
  approvalUrl: string;
}
