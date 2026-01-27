import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 1 })
  @Expose()
  productId: number;

  @ApiProperty({ example: 'HORNO...' })
  @Expose()
  productName: string;

  @ApiProperty({ example: null, required: false })
  @Expose()
  productSku: string | null;

  @ApiProperty({ example: null, required: false })
  @Expose()
  productImage: string | null;

  @ApiProperty({ example: 2 })
  @Expose()
  quantity: number;

  @ApiProperty({ example: 69 })
  @Expose()
  unitPrice: number;

  @ApiProperty({ example: 138 })
  @Expose()
  totalPrice: number;

  @ApiProperty({ example: 1 })
  @Expose()
  orderId: number;

  @ApiProperty({ example: '2026-01-27T16:31:57.646Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2026-01-27T16:31:57.646Z' })
  @Expose()
  updatedAt: Date;
}
