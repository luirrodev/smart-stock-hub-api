import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Nombre del rol',
    example: 'admin',
  })
  readonly name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Descripción del rol',
    example: 'Rol de administrador',
  })
  readonly description?: string;
}
