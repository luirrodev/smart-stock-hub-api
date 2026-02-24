import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @Expose()
  @ApiProperty({
    description: 'ID único de la categoría',
    type: Number,
    example: 1,
  })
  id: number;

  @Expose()
  @ApiProperty({
    description: 'Nombre de la categoría',
    type: String,
    example: 'Electrodomésticos',
  })
  name: string;

  @Expose()
  @ApiProperty({
    description: 'Slug de la categoría para usar en URLs amigables',
    type: String,
    example: 'electronica',
  })
  slug: string;
}
