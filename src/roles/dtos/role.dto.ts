import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
} from 'class-validator';

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

export class AssignPermissionsDto {
  @IsNotEmpty({ each: true })
  @IsArray()
  @ApiProperty({
    description: 'Nombre de los permisos a asignar',
    example: ['create_user', 'update_user'],
  })
  readonly permissionIds: number[];
}
