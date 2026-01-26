import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProductInCartDto } from './product-in-cart-dto';

export class CartItemResponseDto {
  @ApiProperty({ example: 'a3f8e9d2-...' })
  @Expose()
  id: string;

  @ApiProperty({ type: () => ProductInCartDto, required: false })
  @Expose()
  @Type(() => ProductInCartDto)
  product?: ProductInCartDto;

  @ApiProperty({ example: 2 })
  @Expose()
  quantity: number;

  @ApiProperty({ example: '75.00' })
  @Expose()
  price: number;

  @ApiProperty({ example: '150.00' })
  @Expose()
  subtotal: number;
}
