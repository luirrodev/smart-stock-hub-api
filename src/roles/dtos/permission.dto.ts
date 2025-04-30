import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Nombre del permiso',
    example: 'create_user',
  })
  readonly name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Descripción del permiso',
    example: 'Permite crear un usuario',
  })
  readonly description: string;
}
