import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsPositive } from 'class-validator';
import { PaymentProvider } from '../../stores/entities/store-payment-config.entity';

export class CreatePaymentDto {
  @ApiProperty({ example: 123, description: 'ID de la orden a pagar' })
  @IsInt({ message: 'El ID de la orden debe ser un número entero' })
  @IsPositive({ message: 'El ID de la orden debe ser un número positivo' })
  orderId: number;

  @ApiProperty({ example: PaymentProvider.PAYPAL })
  @IsEnum(PaymentProvider, {
    message: 'El proveedor de pago debe ser un valor válido',
  })
  provider: PaymentProvider;
}
