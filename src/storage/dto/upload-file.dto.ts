import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  folder: string;

  @IsOptional()
  @Transform(({ value }) => {
    // Convertir string "false", "0", "no" a boolean false
    // Convertir string "true", "1", "yes" a boolean true
    if (typeof value === 'string') {
      return !['false', '0', 'no', ''].includes(value.toLowerCase());
    }
    if (typeof value === 'boolean') {
      return value;
    }
    return true; // default a true
  })
  @IsBoolean()
  @ApiPropertyOptional({
    description:
      'Indica si el archivo debe ser público (true) o privado (false). Por defecto es true.',
    default: true,
  })
  isPublic?: boolean;
}

export class UploadMultipleFilesDto {
  @IsString()
  @IsNotEmpty()
  folder: string;

  @IsOptional()
  @Transform(({ value }) => {
    // Convertir string "false", "0", "no" a boolean false
    // Convertir string "true", "1", "yes" a boolean true
    if (typeof value === 'string') {
      return !['false', '0', 'no', ''].includes(value.toLowerCase());
    }
    if (typeof value === 'boolean') {
      return value;
    }
    return true; // default a true
  })
  @IsBoolean()
  @ApiPropertyOptional({
    description:
      'Indica si los archivos deben ser públicos (true) o privados (false). Por defecto es true.',
    default: true,
  })
  isPublic?: boolean;
}

export class GetSignedUrlDto {
  @IsString()
  @IsNotEmpty()
  key: string;
}
