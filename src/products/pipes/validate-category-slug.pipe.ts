import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';

/**
 * Pipe customizado para validar y transformar el slug de categoría
 * Asegura que el slug cumple con el formato: solo letras minúsculas, números y guiones
 * No puede comenzar ni terminar con guión
 */
@Injectable()
export class ValidateCategorySlugPipe implements PipeTransform {
  private readonly SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  private readonly ERROR_MESSAGE =
    'El slug solo puede contener letras minúsculas (a-z), números (0-9) y guiones (-). ' +
    'No puede comenzar ni terminar con guión. Longitud máxima: 200 caracteres.';

  transform(value: any, metadata: ArgumentMetadata): string {
    // Validar que sea una cadena
    if (typeof value !== 'string') {
      throw new BadRequestException('El slug debe ser una cadena de texto');
    }

    // Validar longitud mínima
    if (value.length < 1) {
      throw new BadRequestException('El slug debe tener al menos 1 carácter');
    }

    // Validar longitud máxima
    if (value.length > 200) {
      throw new BadRequestException('El slug no puede exceder 200 caracteres');
    }

    // Validar formato (solo letras minúsculas, números y guiones)
    if (!this.SLUG_REGEX.test(value)) {
      throw new BadRequestException(this.ERROR_MESSAGE);
    }

    return value;
  }
}
