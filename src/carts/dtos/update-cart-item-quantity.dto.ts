import { IsInt, Min } from 'class-validator';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { CartQueryDto } from './cart-query.dto';

export class UpdateCartItemQuantityDto extends PickType(CartQueryDto, [
  'sessionId',
]) {
  @ApiProperty({ description: 'Nueva cantidad', example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;
}
