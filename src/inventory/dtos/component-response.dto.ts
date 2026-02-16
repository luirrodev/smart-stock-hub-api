import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class ComponentResponseDto {
  @ApiProperty({
    description: 'ID del componente',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Código único del componente',
    example: 'COMP-001',
  })
  code: string;

  @ApiProperty({
    description: 'Nombre del componente',
    example: 'Resistencia 10kΩ',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción del componente',
    example: 'Resistencia de película delgada de 10 kilohmios',
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Peso del componente',
    example: 0.5,
  })
  weight: number | null;

  @ApiPropertyOptional({
    description: 'Unidad de medida',
    example: 'kg',
  })
  unit: string | null;

  @ApiProperty({
    description: 'Indica si el componente está activo',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Indica si el componente es visible',
    example: true,
  })
  isVisible: boolean;

  @ApiProperty({
    description: 'Indica si el componente está archivado',
    example: false,
  })
  isArchived: boolean;

  @ApiPropertyOptional({
    description: 'ID del usuario que creó el componente',
    example: 1,
  })
  createdBy: number | null;

  @ApiPropertyOptional({
    description: 'ID del usuario que modificó el componente',
    example: 1,
  })
  updatedBy: number | null;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2025-01-01T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2025-01-15T14:30:00Z',
  })
  updatedAt: Date;

  @Exclude()
  deletedAt: Date | null;
}
