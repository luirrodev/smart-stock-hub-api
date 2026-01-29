import { ApiProperty } from '@nestjs/swagger';
import { Expose, Exclude, Transform } from 'class-transformer';
import {
  PaymentProvider,
  PaymentMode,
} from '../entities/store-payment-config.entity';

@Exclude()
export class StorePaymentConfigResponseDto {
  @Exclude()
  @ApiProperty({ example: 1 })
  id: number;

  @Exclude()
  @ApiProperty({ example: 10 })
  storeId: number;

  @Expose()
  @ApiProperty({ enum: PaymentProvider, example: PaymentProvider.PAYPAL })
  provider: PaymentProvider | string;

  @Expose()
  @ApiProperty({ example: 'CLIENT-ID-XYZ' })
  clientId: string;

  @Expose()
  @ApiProperty({ enum: PaymentMode, example: PaymentMode.SANDBOX })
  mode: PaymentMode | string;

  @Expose()
  @ApiProperty({ example: true })
  isActive: boolean;

  @Expose()
  @ApiProperty({
    example: 'https://example.com/payments/webhook',
    required: false,
  })
  webhookUrl?: string | null;

  @Exclude()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : value))
  @ApiProperty({ example: '2026-01-29T12:00:00.000Z' })
  createdAt: Date | string;

  @Expose()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : value))
  @ApiProperty({ example: '2026-01-29T12:00:00.000Z' })
  updatedAt: Date | string;
}
