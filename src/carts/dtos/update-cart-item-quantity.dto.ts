import { IsInt, Min, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCartItemQuantityDto {
  @ApiProperty({ description: 'Nueva cantidad', example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;

  // @ApiPropertyOptional({
  //   description: 'Session ID para invitados',
  //   example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  // })
  @IsOptional()
  @IsString()
  sessionId?: string;
}
