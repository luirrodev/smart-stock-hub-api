import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '../entities/payment-status.enum';

export class PaymentResponseDto {
  @ApiProperty({ example: 1, description: 'ID del pago' })
  @Expose()
  id: number;

  @ApiProperty({ example: 123, description: 'ID de la orden asociada' })
  @Expose()
  orderId: number;

  @ApiProperty({ example: 1, description: 'ID de la tienda' })
  @Expose()
  storeId: number;

  @ApiProperty({
    example: 'paypal',
    description: 'Proveedor de pago (paypal, stripe, etc.)',
  })
  @Expose()
  provider: string;

  @ApiProperty({
    example: '5O190127TN364715T',
    description: 'ID de la orden en el proveedor de pago',
  })
  @Expose()
  providerOrderId: string;

  @ApiProperty({ example: 100.5, description: 'Monto del pago' })
  @Expose()
  amount: number;

  @ApiProperty({ example: 'USD', description: 'Código de moneda ISO 4217' })
  @Expose()
  currency: string;

  @ApiProperty({
    example: PaymentStatus.COMPLETED,
    enum: PaymentStatus,
    description: 'Estado del pago',
  })
  @Expose()
  status: PaymentStatus;

  @ApiProperty({
    example: '2026-01-30T20:12:00.000Z',
    description: 'Fecha de creación',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    example: '2026-01-30T20:15:00.000Z',
    description: 'Fecha de última actualización',
  })
  @Expose()
  updatedAt: Date;
}
