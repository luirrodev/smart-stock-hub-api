import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '../entities/payment-status.enum';

class OrderPaymentInfoDto {
  @ApiProperty({ example: 123, description: 'ID de la orden' })
  @Expose()
  id: number;

  @ApiProperty({ example: 'ORD-20260130-001', description: 'Número de orden' })
  @Expose()
  orderNumber: string;

  @ApiProperty({ example: 250.75, description: 'Monto total de la orden' })
  @Expose()
  total: number;

  @ApiProperty({
    example: PaymentStatus.PENDING,
    enum: PaymentStatus,
    description: 'Estado del pago de la orden',
  })
  @Expose()
  paymentStatus: PaymentStatus;
}

class StorePaymentInfoDto {
  @ApiProperty({ example: 1, description: 'ID de la tienda' })
  @Expose()
  id: number;

  @ApiProperty({
    example: 'Tienda Principal',
    description: 'Nombre de la tienda',
  })
  @Expose()
  name: string;
}

export class PaymentResponseDto {
  @ApiProperty({ example: 1, description: 'ID del pago' })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Información básica de la tienda asociada al pago',
    type: () => StorePaymentInfoDto,
  })
  @Expose()
  @Type(() => StorePaymentInfoDto)
  store: StorePaymentInfoDto;

  @ApiProperty({
    description: 'Información básica de la orden asociada al pago',
    type: () => OrderPaymentInfoDto,
  })
  @Expose()
  @Type(() => OrderPaymentInfoDto)
  order: OrderPaymentInfoDto;

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
    example: '2026-01-30T20:15:00.000Z',
    description: 'Fecha de última actualización',
  })
  @Expose()
  updatedAt: Date;
}
