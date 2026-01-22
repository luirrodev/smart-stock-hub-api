import {
  IsInt,
  IsPositive,
  IsString,
  IsOptional,
  Length,
} from 'class-validator';

export class CreateShippingAddressDto {
  @IsInt()
  @IsPositive()
  readonly customerId: number;

  @IsString()
  @Length(1, 100)
  readonly province: string;

  @IsString()
  @Length(1, 100)
  readonly municipality: string;

  @IsString()
  @Length(1, 100)
  readonly firstName: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  readonly middleName?: string;

  @IsString()
  @Length(1, 100)
  readonly lastName: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  readonly secondLastName?: string;

  @IsString()
  @Length(1, 255)
  readonly street: string;

  @IsString()
  @Length(1, 50)
  readonly number: string;

  @IsOptional()
  @IsString()
  @Length(0, 50)
  readonly apartment?: string;

  @IsOptional()
  @IsString()
  @Length(0, 50)
  readonly floor?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  readonly betweenStreets?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  readonly neighborhood?: string;

  @IsString()
  @Length(1, 20)
  readonly postalCode: string;

  @IsString()
  @Length(1, 20)
  readonly contactPhone: string;
}
