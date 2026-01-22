import {
  IsInt,
  IsOptional,
  IsString,
  IsISO8601,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateCustomerDto {
  @IsInt()
  @IsPositive()
  readonly userId: number;

  @IsOptional()
  @IsInt()
  readonly purchaseCount?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  readonly totalSpent?: number;

  @IsOptional()
  @IsISO8601()
  readonly lastPurchaseAt?: string;

  @IsOptional()
  @IsString()
  readonly notes?: string;
}

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
