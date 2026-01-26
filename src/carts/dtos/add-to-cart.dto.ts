import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
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

  @ApiProperty({
    description: 'ID de sesión para usuarios invitados (UUID)',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  sessionId?: string | null;

  // @ApiProperty({
  //   description: 'ID del usuario autenticado',
  //   example: 1,
  //   required: false,
  // })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number | null;
}
