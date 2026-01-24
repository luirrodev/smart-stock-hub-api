import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsPositive, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @ApiProperty({
    description: 'Número de página (comenzando desde 1)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number = 1;

  @ApiProperty({
    description: 'Cantidad de registros por página',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;

  @ApiProperty({
    description: 'Término de búsqueda para filtrar resultados',
    example: 'arduino',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class PaginatedResponse<T> {
  @ApiProperty({
    description: 'Array de datos',
  })
  data: T[];

  @ApiProperty({
    description: 'Página actual',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Cantidad de registros por página',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total de registros',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Total de páginas',
    example: 10,
  })
  totalPages: number;

  @ApiProperty({
    description: 'IndicaUsi hay una página anterior',
    example: false,
  })
  hasPrevious: boolean;

  @ApiProperty({
    description: 'Indica si hay una página siguiente',
    example: true,
  })
  hasNext: boolean;
}
