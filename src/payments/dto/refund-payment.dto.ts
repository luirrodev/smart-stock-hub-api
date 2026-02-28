import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';

export class RefundPaymentDto {
  @ApiProperty({
    description: 'Monto a reembolsar (opcional para reembolso total)',
    example: '99.99',
    type: 'number',
    required: false,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Motivo del reembolso',
    example: 'Producto defectuoso',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
