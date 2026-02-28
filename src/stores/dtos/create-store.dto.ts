import {
  IsString,
  IsOptional,
  IsEmail,
  MaxLength,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateStoreDto {
  @ApiProperty({ example: 'Mi Tienda', maxLength: 150 })
  @IsString()
  @MaxLength(150)
  readonly name: string;

  @ApiProperty({ example: 'Calle Principal 123', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  readonly address: string;

  @ApiProperty({ example: 'Ciudad de México', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  readonly city: string;

  @ApiProperty({ example: 'CDMX', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  readonly state: string;

  @ApiProperty({ example: '06600', maxLength: 20 })
  @IsString()
  @MaxLength(20)
  readonly zipCode: string;

  @ApiProperty({ example: 'México', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  readonly country: string;

  @ApiProperty({ example: '+52 55 1234 5678', required: false, maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  readonly phone?: string;

  @ApiProperty({ example: 'tienda@ejemplo.com', required: false, maxLength: 150 })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  readonly email?: string;
}

export class UpdateStoreDto extends PartialType(CreateStoreDto) {}
