import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProductListDto } from 'src/products/dtos/product-response.dto';

export class CartItemResponseDto {
  @ApiProperty({ example: 'a3f8e9d2-...' })
  @Expose()
  id: string;

  @ApiProperty({ type: () => ProductListDto, required: false })
  @Expose()
  @Type(() => ProductListDto)
  product?: ProductListDto;

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
