import {
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateInventoryDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  warehouseId: number;

  @IsNumber()
  @Min(0)
  currentQuantity: number;

  @IsNumber()
  @Min(0)
  reservedQuantity: number;

  @IsNumber()
  @Min(0)
  minStock: number;

  @IsNumber()
  @Min(0)
  maxStock: number;

  @IsDateString()
  @IsOptional()
  expirationDate?: Date;

  @IsOptional()
  @IsString()
  serialNumber?: string;
}

export class UpdateInventoryDto extends PartialType(CreateInventoryDto) {}

export class InventoryResponseDto {
  id: number;
  productId: number;
  warehouseId: number;
  currentQuantity: number;
  reservedQuantity: number;
  minStock: number;
  maxStock: number;
  batchNumber?: string;
  serialNumber?: string;
  expirationDate?: Date;
  updatedAt: Date;
}
