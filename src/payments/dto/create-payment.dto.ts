import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsPositive } from 'class-validator';
import { PaymentProvider } from '../../stores/entities/store-payment-config.entity';

export class CreatePaymentDto {
  @ApiProperty({ example: 123, description: 'ID de la orden a pagar' })
  @IsInt()
  @IsPositive()
  orderId: number;

  @ApiProperty({ example: PaymentProvider.PAYPAL })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;
}
