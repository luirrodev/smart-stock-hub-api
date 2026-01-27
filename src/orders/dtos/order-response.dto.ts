import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { OrderItemResponseDto } from './order-item-response.dto';
import { StoreResponseDto } from '../../stores/dtos/store-response.dto';

export class OrderResponseDto {
  @ApiProperty({ example: 'ORD-20260127-396973' })
  @Expose()
  orderNumber: string;

  @ApiProperty({ example: 10 })
  customerId: number;

  @ApiProperty({ example: 'pending' })
  @Expose()
  paymentStatus: string;

  @ApiProperty({ example: 'card', required: false })
  @Expose()
  paymentMethod: string | null;

  @ApiProperty({ example: 388 })
  @Expose()
  total: number;

  @ApiProperty({ example: 'USD' })
  @Expose()
  currency: string;

  @ApiProperty({ type: () => OrderItemResponseDto, isArray: true })
  @Expose()
  @Type(() => OrderItemResponseDto)
  items: OrderItemResponseDto[];
}
