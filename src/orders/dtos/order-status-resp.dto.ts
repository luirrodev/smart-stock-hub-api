import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderStatusResponseDto {
  @ApiProperty({
    description: 'Nombre legible del estado',
    example: 'Pending',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Descripción del estado',
    example: 'Pedido pendiente de ser procesado',
    required: false,
  })
  @Expose()
  description?: string | null;
}
