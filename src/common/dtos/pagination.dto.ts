import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsPositive, Min, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @ApiProperty({
    description: 'Número de página (default: 1)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number = 1;

  @ApiProperty({
    description: 'Cantidad de registros por página (default: 10)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;

  @ApiProperty({
    description: 'Término de búsqueda para filtrar resultados',
    example: 'Parrilla Tostadora',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Campo por el que ordenar',
    example: 'name',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({
    description: 'Dirección de orden: ASC o DESC',
    example: 'ASC',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortDir?: 'ASC' | 'DESC' = 'ASC';
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
