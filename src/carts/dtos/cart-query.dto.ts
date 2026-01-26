import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class CartQueryDto {
  @ApiPropertyOptional({
    description:
      'ID de sesión para usuarios invitados (UUID). Debe viajar en query string.',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsOptional()
  @IsUUID()
  sessionId?: string | null;
}
