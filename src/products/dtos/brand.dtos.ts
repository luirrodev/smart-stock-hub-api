import { IsString, IsUrl, IsNotEmpty, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsUrl()
  @IsOptional()
  readonly image: string;
}

export class UpdateBrandDto extends PartialType(CreateBrandDto) {}
