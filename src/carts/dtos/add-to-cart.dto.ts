import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CartQueryDto } from './cart-query.dto';

export class AddToCartDto extends PickType(CartQueryDto, ['sessionId']) {
  @ApiProperty({ description: 'ID interno del producto', example: 123 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({ description: 'Cantidad a añadir', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number | null;
}
