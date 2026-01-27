import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 123, description: 'ID de la orden a pagar' })
  @IsInt()
  @IsPositive()
  orderId: number;
}
