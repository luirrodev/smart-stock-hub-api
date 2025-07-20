import { PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsInt,
} from 'class-validator';
import { User } from 'src/users/entities/user.entity';

export class CreateWarehouseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsInt()
  @IsNotEmpty()
  managerId: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class UpdateWarehouseDto extends PartialType(CreateWarehouseDto) {}

export class WarehouseManagerDto {
  name: string;
}

export class WarehouseResponseDto {
  id: number;
  name: string;
  address: string;
  code: string;
  manager: WarehouseManagerDto;
  active: boolean;
}
