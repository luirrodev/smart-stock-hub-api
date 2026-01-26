import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ItemParamDto {
  @ApiProperty({
    description: 'ID del item en el carrito',
    example: 'a3f8e9d2-...',
  })
  @IsUUID()
  itemId: string;
}
