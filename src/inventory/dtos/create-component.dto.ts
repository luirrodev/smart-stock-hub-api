import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateComponentDto {
  @ApiProperty({
    description: 'Código único del componente',
    example: 'COMP-001',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Nombre del componente',
    example: 'Resistencia 10kΩ',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción del componente',
    example: 'Resistencia de película delgada de 10 kilohmios',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Peso del componente',
    example: 0.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({
    description: 'Unidad de medida del componente',
    example: 'kg',
  })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({
    description: 'Indica si el componente está activo',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Indica si el componente es visible',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({
    description: 'Indica si el componente está archivado',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
