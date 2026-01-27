import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class StoreResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'AllNovu' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'No definida' })
  @Expose()
  address: string;

  @ApiProperty({ example: 'No definida' })
  @Expose()
  city: string;

  @ApiProperty({ example: 'No definida' })
  @Expose()
  state: string;

  @ApiProperty({ example: 'No definida' })
  @Expose()
  zipCode: string;

  @ApiProperty({ example: 'No definida' })
  @Expose()
  country: string;

  @ApiProperty({ example: null, required: false })
  @Expose()
  phone: string | null;

  @ApiProperty({ example: null, required: false })
  @Expose()
  email: string | null;

  @ApiProperty({ example: '2026-01-27T16:31:46.703Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2026-01-27T16:31:46.703Z' })
  @Expose()
  updatedAt: Date;
}
