import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  folder: string;

  @IsOptional()
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
