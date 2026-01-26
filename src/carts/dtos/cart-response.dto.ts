import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CartStatus } from '../entities/cart.entity';
import { CartItemResponseDto } from './cart-item-response.dto';

export class CartResponseDto {
  @ApiProperty({ example: 'a3f8e9d2-...' })
  @Expose()
  id: string;

  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    required: false,
  })
  @Expose()
  sessionId?: string | null;

  @ApiProperty({ type: () => CartItemResponseDto, isArray: true })
  @Expose()
  @Type(() => CartItemResponseDto)
  items: CartItemResponseDto[];

  @ApiProperty({ example: 3 })
  @Expose()
  totalItems: number;

  @ApiProperty({ example: '150.00' })
  @Expose()
  subtotal: number;
}
