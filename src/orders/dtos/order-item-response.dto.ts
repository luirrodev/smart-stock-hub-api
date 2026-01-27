import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemResponseDto {
  @ApiProperty({ example: 'HORNO...' })
  @Expose()
  productName: string;

  @ApiProperty({ example: 2 })
  @Expose()
  quantity: number;

  @ApiProperty({ example: 69 })
  @Expose()
  unitPrice: number;

  @ApiProperty({ example: 138 })
  @Expose()
  totalPrice: number;
}
