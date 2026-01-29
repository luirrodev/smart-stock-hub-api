import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { PaymentProvider } from '../entities/store-payment-config.entity';

export class CapturePaymentDto {
  @ApiProperty({
    example: 'ORDER_ID_123456',
    description: 'ID de la orden en el proveedor de pago (PayPal, Stripe, etc.)',
  })
  @IsString()
  @IsNotEmpty()
  providerOrderId: string;

  @ApiProperty({
    example: PaymentProvider.PAYPAL,
    description: 'Proveedor de pago utilizado',
    enum: PaymentProvider,
  })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;
}
